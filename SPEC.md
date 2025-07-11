# Payments Contract In Depth Implementation SPEC 

This document exists as a supplement to the very thorough and useful README. The README covers essentially everything you need to know as a user of the payments contract. This document exists for very advanced users and implementers to cover the internal workings of the contract in depth. You should understand the README first before reading this document.

- [Skeleton Keys for Understanding](#keystones-for-understanding]
	- [Three Core Datastructures](#three-core-datastructures)
	- [Mixing of Buckets](#mixing-of-buckets)
	- [Invariants Enforced Eagerly](#invariants-enforced-eagerly)
- [Operator Approval](#operator-approval)
- [Accounts and Account Settlement](#accounts-and-account-settlement)
- [Rails and Rail Settlement](#rails-and-rail-settlement)
- [Rail States](#rail-states)
- [Validation](#validation)


## Skeleton Keys for Understanding 

Some concepts are a bit tricky and show up throughout the code in subtle ways. Once you understand them it makes things easier.

### Three Core Datastructures

There are three essential data structures in this contract.  The [`Account`](#accounts-and-account-settlement), the [`Rail`](#rails-and-rail-settlement) and the [`OperatorApproval`](#operator-approval). Accounts hold funds of a particular token associated with a public key. They are used for paying and receiving payment. Rails are used to track point to point payments between Accounts. OperatorApprovals allow an operator contract to setup and modify payments between parties under usage contraints.

Each public key identity can have multiple Accounts of different token type. Each Account can have multiple operators that it has approved to process payments. Each Account can also have multiple outgoing payment rails. Each rail represents a different payee. There is one operator per rail. One operator can manage many rails and each rail can have a different operator. To consider the general picture it can be helpful to think of a set of operators per account and a set of rails per operator. 

### Mixing of Buckets

The payments contract has two main methods of payment: rate based and one time. Each core datastructure has a pairs of variables that seem to reflect this dichotomy: (`rateAllowance`, `lockupAllowance`) for operator approval, (`lockupCurrent`, `lockupRate`) for accounts, and (`lockupFixed`, `paymentRate`) for rails. The payments contract does separate accounting based on rates and funds available for one time payment largely by manipulating these separate variables. But there is a big exception that shows up throughout -- the Streaming Lockup.

To recap from the README the Streaming Lockup are funds that must be locked to cover a rail's `lockupPeriod` (for motivation see the README). Internally the payments contract does not consistently organize this bucket of funds separately but sometimes mixes it in with its accounting for fixed lockup. The accounting for approval and accounts *mixes buckets* while rail accounting keeps them separate. `lockupAllowance` and `lockupCurrent` both track one number that is a sum of streaming lockups for rate requirements and fixed lockup for one time payment coverage.

As an example of how this manifests itself consider a call to `modifyRailPayment` increasing the payment rate of a rail.  For this operation to go through not only does the `rateAllowance` need to be high enough for the operator increase its rate usage, the `lockupAllowance` must also be high enough to cover the new component of streaming lockup.

### Invariants are Enforced Eagerly

The most pervasive pattern in the payments contract is the usage of pre and post condition modifiers. The bulk of these modifier calls force invariants within the fields of the three core datastructures to be true. The major invariant being enforced is that accounts are always settled as far as possible. In fact this is the only place where account settlement occurs (for more detail see [section below](#accounts-and-account-settlement)). Additionally there are invariants making sure that rails don't attempt to spend more than their fixed lockup and that account locked funds are always covered by account balance. There are also selectively used invariants asserting that rails are in particular termination states for particular methods.

Every interesting function modifying the state of the payments contract runs a group of core account settlement related invariant pre and post conditions via the `settleAccountLockupBeforeAndAfter` or the `settleAccountLockupBeforeAndAfterForRail` modifier. This is a critical mechanism to be aware of when reasoning through which invariants apply during the execution of payments contract methods.

## Operator Approval

As describe above operator approvals consist of the pair of `rateAllowance` and `lockupAllowance`.  Approvals are per operator and rate and lockup resource usage are summed across all of an operator's rails when checking for sufficient operator approval during rail operations.  Approvals also include a `maxLockupPeriod` restricting the operator's ability to make lockup period too long.

The OperatorApproval struct 

```solidity
    struct OperatorApproval {
        bool isApproved;
        uint256 rateAllowance;
        uint256 lockupAllowance;
        uint256 rateUsage; // Track actual usage for rate
        uint256 lockupUsage; // Track actual usage for lockup
        uint256 maxLockupPeriod; // Maximum lockup period the operator can set for rails created on behalf of the client
    }
```

An important counterintuitive fact about the approval allowances is that they are not constrained in relation to current usage. Usage can be lower than allowance if an operator has not used all of their existing allowance. Usage can be higher than allowance if a client has manually reduced the operator's allowance. As explained in the README reducing allowance below usage on any of the allowance resources (rate, lockup, period) will not impact existing rails. Allowance invariants are checked at the point in time of rail modification not continuously enforced. Furthermore reductions in usage always go through even if the current allowance is below the new usage. For example if a rail has an allowance of 20 locked tokens and uses all of them to lock up 20 tokens, and then the client brings allowance for the operator down to 1 locked token the operator can still modify the rail usage down to 15 locked tokens even though it exceeds the operator's current allowance.

Another quirk of the allowance system is the difference with which rate changes and one time payments impact the lockup allowance. When modifying a rail's rate change down, say from 5 tokens a block to 4 tokens a block, the operator's lockup approval usage can go down by 1 token * `lockupPeriod` to account for the reduction in streaming lockup. Now the operator can leverage this reduced usage to modify payments upwards in other rails. For one time payments this is not true. When a one time payment clears the approval lockup usage goes down, but additionally the `lockupAllowance` *also goes down* limiting the operator from doing this again. This is essential for the payments sytem to work correctly, otherwise 1 unit of `lockupAllowance` could be used to spend an entire accounts funds in repeated one time payments.

## Accounts and Account Settlement

Account settlement roughly speaking flows funds out of a depositing payer's account into a staging bucket without completing the flow of funds to the payee -- that part is done during rail settlement.  To enable the contract to efficiently handle many payment rails paying one account, accounts only maintain global state of lockup requirements.  Account track deposited funds, total locked funds, rate of continuous lockup and the last epoch they were settled at.  

The account struct 
```solidity
    struct Account {
        uint256 funds;
        uint256 lockupCurrent;
        uint256 lockupRate;
        // epoch up to and including which lockup has been settled for the account
        uint256 lockupLastSettledAt;
    }
```

The `lockupCurrent` field is the intermediate bucket holding onto funds claimed by rails.  The free funds of the account are `funds` - `lockupCurrent`.  


## Rails and Rail Settlement