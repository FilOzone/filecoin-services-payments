pragma solidity ^0.8.30;

import "forge-std/Script.sol";

import "../src/Payments.sol";
import "../test/mocks/MockERC20.sol";

contract Profile is Script {
    function run() public {
        vm.startBroadcast();

        ERC20 token = new MockERC20("MockToken", "MOCK");

        Payments payments = new Payments();

        address from = address(this);
        address to = address(this);
        address validator = address(this);

        uint256 commissionRateBps = 0;
        address serviceFeeRecipient = address(this);
        
        //payments.createRail(address(token), from, to, validator, commissionRateBps, serviceFeeRecipient);

        vm.stopBroadcast();
    }
}
