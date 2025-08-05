pragma solidity ^0.8.30;

import "forge-std/Script.sol";

import "../src/Payments.sol";
import "../test/mocks/MockERC20.sol";

contract Profile is Script {
    function run(address sender) public {
        vm.startBroadcast();

        ERC20 token = new MockERC20("MockToken", "MOCK");

        Payments payments = new Payments();

        address from = sender;
        address to = sender;
        address operator = sender;
        address validator = sender;

        uint256 commissionRateBps = 0;
        address serviceFeeRecipient = sender;
        
        uint256 rateAllowance = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
        uint256 lockupAllowance = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
        uint256 maxLockupPeriod = 0x00ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;

        payments.setOperatorApproval(address(token), operator, true, rateAllowance, lockupAllowance, maxLockupPeriod);

        payments.createRail(address(token), from, to, validator, commissionRateBps, serviceFeeRecipient);


        // deposit
        // depositWithPermit
        // depositWithPermitAndApproveOperator
        // depositWithPermitAndIncreaseOperatorApproval
        // modifyRailPayment
        // modifyRailLockup
        // increaseOperatorApproval
        // settleRail
        // withdraw
        // withdrawTo
        // terminateRail
        // settleTerminatedRailWithoutValidation

        vm.stopBroadcast();
    }
}
