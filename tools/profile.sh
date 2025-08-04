#!/bin/bash

pushd ../localnet
source ./local_lotus.sh
popd

forge script -vvv -g 20000 --broadcast --chain-id $CHAIN_ID --sender $SENDER_ADDRESS --private-key $SENDER_KEY --rpc-url $API_URL/rpc/v1 tools/Profile.sol:Profile

