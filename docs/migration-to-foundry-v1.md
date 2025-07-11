# Migration to Foundry v1.0+ and Later

## Background

If you are upgrading your project from an older version of Foundry (such as `0.3.x`) to Foundry `v1.0` or later (including `1.2.x`), you need to be aware of an important change in the default compiler settings that affects contract deployment.

## Change in Default Optimizer Behavior (Breaking change)

Starting with Foundry `v1.0`, the Solidity optimizer is disabled by default. In previous versions, the optimizer was enabled by default (with approximately 200 runs). This change can cause the compiled contract bytecode to be significantly larger if you do not explicitly enable the optimizer in your configuration.

Reference: [Foundry v1.0 Migration Guide](https://getfoundry.sh/misc/v1.0-migration/#solc-optimizer-disabled-by-default)

## Impact

If you compile contracts with Foundry `v1.0+` using the default settings, you may encounter deployment errors on networks that enforce the [`EIP-170`](https://eips.ethereum.org/EIPS/eip-170) contract size limit (24,576 bytes, or 24 KB). For example, deploying to Filecoin EVM, Ethereum mainnet, or other compatible chains may fail with errors such as:
```bash
Error: server returned an error response: error code 11: message execution failed (exit=[ErrIllegalArgument(16)], revert reason=[message failed with backtrace:
00: f010 (method 4) -- send aborted with code 16 (16)
01: f01 (method 3) -- constructor failed: send aborted with code 16 (16)
02: f01009 (method 1) -- EVM byte code length (40517) is exceeding the maximum allowed of 24576 (16)
```

## Solution

To restore the previous behavior and ensure your contracts remain deployable, **explicitly enable the optimizer** in your `foundry.toml` configuration file:

```toml
optimizer = true
optimizer_runs = 200
```

You can adjust `optimizer_runs` for different trade-offs between contract size and gas efficiency:
- `200`: Minimize bytecode size
-  `10000` or `20000` (or even higher): Produces slightly larger contracts but reduces gas cost per function call.

Higher values may slightly increase contract size but can reduce gas costs on repeated usage. Ensure the contract size stays below the EIP-170 limit.