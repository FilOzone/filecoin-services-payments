import { Bytes, BigInt as GraphBN, log } from "@graphprotocol/graph-ts";
import {
  AccountLockupSettled as AccountLockupSettledEvent,
  DepositRecorded as DepositRecordedEvent,
  OperatorApprovalUpdated as OperatorApprovalUpdatedEvent,
  Payments as PaymentsContract,
  RailCreated as RailCreatedEvent,
  RailFinalized as RailFinalizedEvent,
  RailLockupModified as RailLockupModifiedEvent,
  RailOneTimePaymentProcessed as RailOneTimePaymentProcessedEvent,
  RailRateModified as RailRateModifiedEvent,
  RailSettled as RailSettledEvent,
  RailTerminated as RailTerminatedEvent,
  WithdrawRecorded as WithdrawRecordedEvent,
} from "../generated/Payments/Payments";
import { Account, Operator, OperatorApproval, Rail, Settlement, Token, UserToken } from "../generated/schema";
import { COMMISSION_MAX_BPS, ONE_BIG_INT } from "./utils/constants";
import {
  createOrLoadAccountByAddress,
  createOrLoadOperator,
  createOrLoadUserToken,
  createRail,
  createRateChangeQueue,
  getTokenDetails,
  updateOperatorLockup,
} from "./utils/helpers";
import { MetricsCollectionOrchestrator } from "./utils/metrics";

export function handleAccountLockupSettled(event: AccountLockupSettledEvent): void {
  const tokenAddress = event.params.token;
  const ownerAddress = event.params.owner;

  const userTokenId = ownerAddress.concat(tokenAddress);
  let userToken = UserToken.load(userTokenId);

  if (!userToken) {
    userToken = new UserToken(userTokenId);
    userToken.account = ownerAddress;
    userToken.token = tokenAddress;
    userToken.funds = GraphBN.zero();
    userToken.lockupCurrent = event.params.lockupCurrent;
    userToken.lockupRate = event.params.lockupRate;
    userToken.lockupLastSettledAt = event.params.lockupLastSettledAt;
  } else {
    // Update lockup fields from event
    userToken.lockupCurrent = event.params.lockupCurrent;
    userToken.lockupRate = event.params.lockupRate;
    userToken.lockupLastSettledAt = event.params.lockupLastSettledAt;
  }

  userToken.save();
}

export function handleOperatorApprovalUpdated(event: OperatorApprovalUpdatedEvent): void {
  const tokenAddress = event.params.token;
  const clientAddress = event.params.client;
  const operatorAddress = event.params.operator;
  const isApproved = event.params.approved;
  const rateAllowance = event.params.rateAllowance;
  const lockupAllowance = event.params.lockupAllowance;
  const maxLockupPeriod = event.params.maxLockupPeriod;

  const clientAccount = Account.load(clientAddress);

  let isNewOperator = false;
  let isNewApproval = false;

  let operator = Operator.load(operatorAddress);
  if (!operator) {
    isNewOperator = true;
    operator = new Operator(operatorAddress);
    operator.address = operatorAddress;
    operator.totalRails = GraphBN.zero();
    operator.totalApprovals = GraphBN.zero();
  }

  const id = clientAddress.concat(operator.id).concat(tokenAddress);
  let operatorApproval = OperatorApproval.load(id);

  if (!operatorApproval) {
    isNewApproval = true;
    operatorApproval = new OperatorApproval(id);
    operatorApproval.client = clientAddress;
    operatorApproval.operator = operatorAddress;
    operatorApproval.token = tokenAddress;
    operatorApproval.isApproved = isApproved;
    operatorApproval.lockupUsage = GraphBN.zero();
    operatorApproval.rateUsage = GraphBN.zero();

    operator.totalApprovals = operator.totalApprovals.plus(ONE_BIG_INT);
    if (clientAccount) {
      clientAccount.totalApprovals = clientAccount.totalApprovals.plus(ONE_BIG_INT);
      clientAccount.save();
    }
  }

  operatorApproval.rateAllowance = rateAllowance;
  operatorApproval.lockupAllowance = lockupAllowance;
  operatorApproval.isApproved = isApproved;
  operatorApproval.maxLockupPeriod = maxLockupPeriod;

  operatorApproval.save();
  operator.save();

  // update Metrics
  MetricsCollectionOrchestrator.collectOperatorApprovalMetrics(
    operatorAddress,
    clientAddress,
    isNewApproval,
    isNewOperator,
    event.block.timestamp,
    event.block.number,
  );
}

export function handleRailCreated(event: RailCreatedEvent): void {
  const railId = event.params.railId;
  const payee = event.params.payee;
  const payer = event.params.payer;
  const arbiter = event.params.validator;
  const tokenAddress = event.params.token;
  const operatorAddress = event.params.operator;
  const commissionRateBps = event.params.commissionRateBps;
  const serviceFeeRecipient = event.params.serviceFeeRecipient;

  const payerAccountWithIsNew = createOrLoadAccountByAddress(payer);
  const payerAccount = payerAccountWithIsNew.account;
  const isNewPayer = payerAccountWithIsNew.isNew;
  const payeeAccountWithIsNew = createOrLoadAccountByAddress(payee);
  const payeeAccount = payeeAccountWithIsNew.account;
  const isNewPayee = payeeAccountWithIsNew.isNew;
  const operatorWithIsNew = createOrLoadOperator(operatorAddress);
  const operator = operatorWithIsNew.operator;
  const isNewOperator = operatorWithIsNew.isNew;

  payerAccount.totalRails = payerAccount.totalRails.plus(GraphBN.fromI32(1));
  payeeAccount.totalRails = payeeAccount.totalRails.plus(GraphBN.fromI32(1));
  operator.totalRails = operator.totalRails.plus(GraphBN.fromI32(1));

  const rail = createRail(
    railId,
    payerAccount,
    payeeAccount,
    operator,
    tokenAddress,
    arbiter,
    GraphBN.zero(),
    commissionRateBps,
    serviceFeeRecipient,
    event.block.number,
  );

  payerAccount.save();
  payeeAccount.save();
  operator.save();

  // Collect Metrics
  MetricsCollectionOrchestrator.collectRailCreationMetrics(
    rail,
    isNewPayer,
    isNewPayee,
    isNewOperator,
    event.block.timestamp,
    event.block.number,
  );
}

export function handleRailTerminated(event: RailTerminatedEvent): void {
  const railId = event.params.railId;

  const rail = Rail.load(Bytes.fromHexString(railId.toHexString()));

  if (!rail) {
    log.warning("[handleRailTerminated] Rail not found for railId: {}", [railId.toString()]);
    return;
  }

  rail.state = "TERMINATED";
  rail.endEpoch = event.params.endEpoch;

  const payerToken = UserToken.load(rail.payer.concat(rail.token));
  if (payerToken) {
    payerToken.lockupRate = payerToken.lockupRate.minus(rail.paymentRate);
    payerToken.save();
  }

  rail.save();

  // collect rail state change metrics
  MetricsCollectionOrchestrator.collectRailStateChangeMetrics(
    rail,
    rail.state,
    "TERMINATED",
    event.block.timestamp,
    event.block.number,
  );
}

export function handleRailLockupModified(event: RailLockupModifiedEvent): void {
  const railId = event.params.railId;
  const oldLockupPeriod = event.params.oldLockupPeriod;
  const newLockupPeriod = event.params.newLockupPeriod;
  const oldLockupFixed = event.params.oldLockupFixed;
  const newLockupFixed = event.params.newLockupFixed;

  const rail = Rail.load(Bytes.fromHexString(railId.toHexString()));

  if (!rail) {
    log.warning("[handleRailLockupModified] Rail not found for railId: {}", [railId.toString()]);
    return;
  }

  const isTerminated = rail.state === "TERMINATED";
  const payerToken = UserToken.load(rail.payer.concat(rail.token));
  const operatorApprovalId = rail.payer.concat(rail.operator).concat(rail.token);
  const operatorApproval = OperatorApproval.load(operatorApprovalId);

  rail.lockupFixed = event.params.newLockupFixed;
  if (!isTerminated) {
    rail.lockupPeriod = event.params.newLockupPeriod;
  }
  rail.save();

  if (!payerToken) {
    return;
  }

  let oldLockup = oldLockupFixed;
  let newLockup = newLockupFixed;

  if (!isTerminated) {
    oldLockup = oldLockupFixed.plus(rail.paymentRate.times(oldLockupPeriod));
    newLockup = newLockupFixed.plus(rail.paymentRate.times(newLockupPeriod));
  }

  updateOperatorLockup(operatorApproval, oldLockup, newLockup);
}

export function handleRailRateModified(event: RailRateModifiedEvent): void {
  const railId = event.params.railId;
  const oldRate = event.params.oldRate;
  const newRate = event.params.newRate;

  const rail = Rail.load(Bytes.fromHexString(railId.toHexString()));

  if (!rail) {
    log.warning("[handleRailPaymentRateModified] Rail not found for railId: {}", [railId.toString()]);
    return;
  }

  rail.paymentRate = event.params.newRate;
  if (oldRate.equals(GraphBN.zero()) && newRate.gt(GraphBN.zero()) && rail.state !== "Active") {
    rail.state = "ACTIVE";

    // Collect rail State change metrics
    MetricsCollectionOrchestrator.collectRailStateChangeMetrics(
      rail,
      "ZERORATE",
      "ACTIVE",
      event.block.timestamp,
      event.block.number,
    );
  }
  rail.totalRateChanges = rail.totalRateChanges.plus(GraphBN.fromI32(1));

  const rateChangeQueue = rail.rateChangeQueue.load();
  if (rateChangeQueue.length === 0 && oldRate.equals(GraphBN.zero())) {
    rail.settledUpto = event.block.number;
  } else {
    if (rateChangeQueue.length === 0) {
      createRateChangeQueue(rail, rail.settledUpto, event.block.number, newRate);
    } else if (event.block.number.notEqual(rateChangeQueue[rateChangeQueue.length - 1].untilEpoch)) {
      const lastRateChange = rateChangeQueue[rateChangeQueue.length - 1];
      createRateChangeQueue(rail, lastRateChange.untilEpoch, event.block.number, newRate);
    }
  }

  rail.paymentRate = newRate;

  rail.save();

  const operatorApprovalId = rail.payer.concat(rail.operator).concat(rail.token);
  const operatorApproval = OperatorApproval.load(operatorApprovalId);

  const payerToken = UserToken.load(rail.payer.concat(rail.token));

  if (!operatorApproval) {
    log.warning("[handleRailPaymentRateModified] Operator approval not found for railId: {}", [railId.toString()]);
    return;
  }

  const isTerminated = rail.state === "TERMINATED";
  if (!isTerminated) {
    operatorApproval.rateUsage = operatorApproval.rateUsage.minus(oldRate).plus(newRate);
    if (operatorApproval.rateUsage.lt(GraphBN.zero())) {
      operatorApproval.rateUsage = GraphBN.zero();
    }
  }

  if (oldRate.notEqual(newRate)) {
    let effectiveLockupPeriod = GraphBN.zero();
    if (isTerminated) {
      effectiveLockupPeriod = rail.endEpoch.minus(event.block.number);
      if (effectiveLockupPeriod.lt(GraphBN.zero())) {
        effectiveLockupPeriod = GraphBN.zero();
      }
    } else if (payerToken) {
      effectiveLockupPeriod = rail.lockupPeriod.minus(event.block.number.minus(payerToken.lockupLastSettledAt));
    }
    if (effectiveLockupPeriod.gt(GraphBN.zero())) {
      const oldLockup = oldRate.times(effectiveLockupPeriod);
      const newLockup = newRate.times(effectiveLockupPeriod);
      // update operator lockup usage and save
      updateOperatorLockup(operatorApproval, oldLockup, newLockup);
      return;
    }
  }
  operatorApproval.save();
}

export function handleRailSettled(event: RailSettledEvent): void {
  const railId = event.params.railId;
  const totalSettledAmount = event.params.totalSettledAmount;
  const totalNetPayeeAmount = event.params.totalNetPayeeAmount;
  const operatorCommission = event.params.operatorCommission;
  const timestamp = event.block.timestamp;
  const blockNumber = event.block.number;

  const paymentsContractAddress = event.address;

  const paymentsContract = PaymentsContract.bind(paymentsContractAddress);

  const filBurnedResult = paymentsContract.try_NETWORK_FEE();

  const rail = Rail.load(Bytes.fromHexString(railId.toHexString()));

  if (!rail) {
    log.warning("[handleSettlementCompleted] Rail not found for railId: {}", [railId.toString()]);
    return;
  }

  // Update rail aggregate data
  rail.totalSettledAmount = rail.totalSettledAmount.plus(totalSettledAmount);
  rail.totalNetPayeeAmount = rail.totalNetPayeeAmount.plus(totalNetPayeeAmount);
  rail.totalCommission = rail.totalCommission.plus(operatorCommission);
  rail.totalSettlements = rail.totalSettlements.plus(GraphBN.fromI32(1));
  rail.settledUpto = event.params.settledUpTo;

  rail.save();

  // Create a new Settlement entity
  const settlementId = event.transaction.hash.concatI32(event.logIndex.toI32());
  const settlement = new Settlement(settlementId);

  settlement.rail = rail.id;
  settlement.totalSettledAmount = totalSettledAmount;
  settlement.totalNetPayeeAmount = totalNetPayeeAmount;
  settlement.operatorCommission = operatorCommission;
  settlement.settledUpto = event.params.settledUpTo;

  // update funds for payer and payee
  const payerToken = UserToken.load(rail.payer.concat(rail.token));
  const payeeToken = UserToken.load(rail.payee.concat(rail.token));
  const token = Token.load(rail.token);
  if (token) {
    token.userFunds = token.userFunds.minus(operatorCommission);
    token.totalSettledAmount = token.totalSettledAmount.plus(totalSettledAmount);
    token.save();
  }

  if (payerToken) {
    payerToken.funds = payerToken.funds.minus(totalSettledAmount);
    payerToken.save();
  }

  if (payeeToken) {
    payeeToken.funds = payeeToken.funds.plus(totalNetPayeeAmount);
    payeeToken.save();
  }

  settlement.save();

  // collect metrics
  MetricsCollectionOrchestrator.collectSettlementMetrics(
    rail,
    totalSettledAmount,
    totalNetPayeeAmount,
    operatorCommission,
    filBurnedResult.reverted ? GraphBN.zero() : filBurnedResult.value,
    timestamp,
    blockNumber,
  );
}

export function handleDepositRecorded(event: DepositRecordedEvent): void {
  const tokenAddress = event.params.token;
  const accountAddress = event.params.from;
  const amount = event.params.amount;

  const tokenWithIsNew = getTokenDetails(tokenAddress);
  const token = tokenWithIsNew.token;
  const isNewToken = tokenWithIsNew.isNew;

  const accountWithIsNew = createOrLoadAccountByAddress(accountAddress);
  const account = accountWithIsNew.account;
  const isNewAccount = accountWithIsNew.isNew;

  const userTokenWithIsNew = createOrLoadUserToken(account, token);
  const userToken = userTokenWithIsNew.userToken;
  const isNewUserToken = userTokenWithIsNew.isNew;

  token.userFunds = token.userFunds.plus(amount);
  token.totalDeposits = token.totalDeposits.plus(amount);
  token.save();

  if (isNewUserToken) {
    account.totalTokens = account.totalTokens.plus(GraphBN.fromI32(1));
    account.save();
  }

  userToken.funds = userToken.funds.plus(amount);
  userToken.save();

  // Collect Metrics
  MetricsCollectionOrchestrator.collectTokenActivityMetrics(
    tokenAddress,
    accountAddress,
    amount,
    true,
    isNewAccount,
    isNewToken,
    event.block.timestamp,
    event.block.number,
  );
}

export function handleWithdrawRecorded(event: WithdrawRecordedEvent): void {
  const tokenAddress = event.params.token;
  const accountAddress = event.params.from;
  const amount = event.params.amount;

  const userTokenId = accountAddress.concat(tokenAddress);
  const userToken = UserToken.load(userTokenId);
  if (!userToken) {
    log.warning("[handleWithdrawRecorded] UserToken not found for id: {}", [userTokenId.toHexString()]);
    return;
  }
  userToken.funds = userToken.funds.minus(amount);
  const token = Token.load(userToken.token);
  if (token) {
    token.userFunds = token.userFunds.minus(amount);
    token.totalWithdrawals = token.totalWithdrawals.plus(amount);
    token.save();
  }
  userToken.save();

  // collect Metrics
  MetricsCollectionOrchestrator.collectTokenActivityMetrics(
    tokenAddress,
    accountAddress,
    amount,
    false,
    false,
    false,
    event.block.timestamp,
    event.block.number,
  );
}

export function handleRailOneTimePaymentProcessed(event: RailOneTimePaymentProcessedEvent): void {
  const railId = event.params.railId;
  const netPayeeAmount = event.params.netPayeeAmount;
  const operatorCommission = event.params.operatorCommission;

  const rail = Rail.load(Bytes.fromHexString(railId.toHexString()));

  if (!rail) {
    log.warning("[handleRailOneTimePaymentProcessed] Rail not found for railId: {}", [railId.toString()]);
    return;
  }

  rail.lockupFixed = rail.lockupFixed.minus(netPayeeAmount);
  rail.totalNetPayeeAmount = rail.totalNetPayeeAmount.plus(netPayeeAmount);
  rail.totalCommission = rail.totalCommission.plus(operatorCommission);
  rail.save();

  const payerToken = UserToken.load(rail.payer.concat(rail.token));
  const payeeToken = UserToken.load(rail.payee.concat(rail.token));
  const token = Token.load(rail.token);
  if (token) {
    token.userFunds = token.userFunds.minus(operatorCommission);
    token.save();
  }
  const oneTimePayment = calculateOneTimePayment(operatorCommission, rail.commissionRateBps);
  if (payerToken) {
    payerToken.funds = payerToken.funds.minus(oneTimePayment);
    payerToken.save();
  }
  if (payeeToken) {
    payeeToken.funds = payeeToken.funds.plus(netPayeeAmount);
    payeeToken.save();
  }

  const operator = Operator.load(rail.operator);
  if (operator) {
    operator.totalCommission = operator.totalCommission.plus(operatorCommission);
    operator.save();
  }

  const operatorApprovalId = rail.payer.concat(rail.operator).concat(rail.token);
  const operatorApproval = OperatorApproval.load(operatorApprovalId);

  if (!operatorApproval) {
    log.warning("[handleRailOneTimePaymentProcessed] Operator approval not found for railId: {}", [railId.toString()]);
    return;
  }

  operatorApproval.lockupAllowance = operatorApproval.lockupAllowance.minus(oneTimePayment);
  operatorApproval.lockupUsage = operatorApproval.lockupUsage.minus(oneTimePayment);
  operatorApproval.save();
}

export function handleRailFinalized(event: RailFinalizedEvent): void {
  const railId = event.params.railId;

  const rail = Rail.load(Bytes.fromHexString(railId.toHexString()));

  if (!rail) {
    log.warning("[handleRailFinalized] Rail not found for railId: {}", [railId.toString()]);
    return;
  }

  const operatorAprrovalId = rail.payer.concat(rail.operator).concat(rail.token);
  const operatorApproval = OperatorApproval.load(operatorAprrovalId);
  const oldLockup = rail.lockupFixed.plus(rail.lockupPeriod.times(rail.paymentRate));
  updateOperatorLockup(operatorApproval, oldLockup, GraphBN.zero());

  rail.state = "FINALIZED";
  rail.save();

  // Collect rail state change metrics
  MetricsCollectionOrchestrator.collectRailStateChangeMetrics(
    rail,
    rail.state,
    "FINALIZED",
    event.block.timestamp,
    event.block.number,
  );
}

function calculateOneTimePayment(operatorCommission: GraphBN, commissionRateBps: GraphBN): GraphBN {
  return operatorCommission.times(COMMISSION_MAX_BPS).div(commissionRateBps);
}
