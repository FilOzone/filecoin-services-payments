#!/bin/bash

pushd ../localnet
source ./local_lotus.sh
popd

forge script -vvv -g 20000 --broadcast --chain-id $CHAIN_ID --sender $SENDER_ADDRESS --private-key $SENDER_KEY --rpc-url $API_URL/rpc/v1 --sig "run(address)" tools/Profile.sol:Profile $SENDER_ADDRESS



../forge-script-gas-report/forge_script_gas_report ./broadcast/Profile.sol/$CHAIN_ID/run-latest.json | tee .gas-profile
