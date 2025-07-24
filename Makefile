# Makefile for Payment Contracts

# Default target
.PHONY: default
default: build test

# All target including installation
.PHONY: all
all: install build test

# Install dependencies
.PHONY: install
install:
	forge install

# Build target
.PHONY: build
build:
	forge build

# Test target
.PHONY: test
test:
	forge test -vv

# Helper: Ensure relevant scripts are executable
.PHONY: chmod-deploy
chmod-deploy:
	chmod +x ./tools/deploy.sh

.PHONY : chmod-upgrade
chmod-upgrade:
	chmod +x ./tools/upgrade-contract.sh

.PHONY: chmod-transfer
chmod-transfer:
	chmod +x ./tools/transfer-owner.sh

.PHONY: chmod-get-owner
chmod-get-owner:
	chmod +x ./tools/get-owner.sh

# Deployment targets
.PHONY: deploy-calibnet
deploy-calibnet: chmod-deploy
	./tools/deploy.sh 314159

.PHONY: deploy-devnet
deploy-devnet: chmod-deploy
	./tools/deploy.sh 31415926

.PHONY: deploy-mainnet
deploy-mainnet: chmod-deploy
	./tools/deploy.sh 314

# Upgrade targets
.PHONY: upgrade-calibnet
upgrade-calibnet: chmod-upgrade
	./tools/upgrade-contract.sh 314159

.PHONY: upgrade-devnet
upgrade-devnet: chmod-upgrade
	./tools/upgrade-contract.sh 31415926

.PHONY: upgrade-mainnet
upgrade-mainnet: chmod-upgrade
	./tools/upgrade-contract.sh 314

# Ownership management targets
.PHONY: transfer-owner
transfer-owner: chmod-transfer
	./tools/transfer-owner.sh

.PHONY: get-owner
get-owner: chmod-get-owner
	./tools/get-owner.sh

