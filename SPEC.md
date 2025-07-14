# Payments Contract In Depth Implementation SPEC 

This document exists as a supplement to the very thorough and useful README. The README covers essentially everything you need to know as a user of the payments contract. This document exists for very advanced users and implementers to cover the internal workings of the contract in depth. You should understand the README first before reading this document.

- [Skeleton Keys for Understanding](#keystones-for-understanding]
	- [Three Core Datastructures](#three-core-datastructures)
	- [The Fundamental Flow of Funds](#the-fundamental-flow-of-funds)
	- [Mixing of Buckets](#mixing-of-buckets)
	- [Invariants Enforced Eagerly](#invariants-enforced-eagerly)
- [Operator Approval](#operator-approval)
- [Accounts and Account Settlement](#accounts-and-account-settlement)
- [Rails and Rail Settlement](#rails-and-rail-settlement)
    - [Validation](#validation)
	- [One Time Payments](#one-time-payments)
- [Rail Termination](#rail-termination)



## Skeleton Keys for Understanding 

Some concepts are a bit tricky and show up throughout the code in subtle ways. Once you understand them it makes things easier.

### Three Core Datastructures

There are three essential data structures in this contract.  The [`Account`](#accounts-and-account-settlement), the [`Rail`](#rails-and-rail-settlement) and the [`OperatorApproval`](#operator-approval). Accounts hold funds of a particular token associated with a public key. They are used for paying and receiving payment. Rails are used to track point to point payments between Accounts. OperatorApprovals allow an operator contract to setup and modify payments between parties under usage contraints.

Each public key identity can have multiple Accounts of different token type. Each Account can have multiple operators that it has approved to process payments. Each Account can also have multiple outgoing payment rails. Each rail represents a different payee. There is one operator per rail. One operator can manage many rails and each rail can have a different operator. To consider the general picture it can be helpful to think of a set of operators per account and a set of rails per operator. 

### The Fundamental Flow of Funds

The first key principle of fund movements: 

> All funds paid from payer to payee in the payment contract are 1) deposited into an account 2) temporarily locked up in the `lockupCurrent` of the payer account 3) moved into the payee account

This applies to both one time payments and standard rate based rail payment flows.

In the case of live rail payment flows funds are temporarily locked during account settlement and moved into the payee account during rail settlement.  We'll refer to these lockup funds as "temporary settling lockup" in this document.

Similarly rail payment flows on terminated rails are locked upon the original rate setting as streaming lockup and are released during settlement of the terminated rail.

For one time payments lockup is explicitly added to `lockupCurrent` of the payer account when setting up the rail for one time payments.  Payments are processed immediately in `modifyRailPayment` with a nonzero `oneTimePayment` parameter -- there is no waiting for rail settlement to process these funds.

One important difference between these two three cases is how they interact with operator approval.  Live rail payment flow approval is managed with `rateAllowance` and `rateUsage`.  Hence temporary settling lockup is added to `lockupCurrent` without any modifications to `lockupUsage` or requirements on `lockupAllowance`.  In contrast the streaming lockup that covers terminated rail settlement is locked throughout rail duration and consumes `lockupAllowance` to increase the operator approval's `lockupUsage`. And of course this is also true of fixed lockup for one time payments.

The second key principle of fund movements:

> Payer account funds may be set aside for transfer but end up unused in which case they are 1) first deposited into an account 2) temporarily locked up in `lockupCurrent` of the payer account 3) moved back to the available balance of the payer account

This is the case for unused fixed lockup set aside for one time payments that are never made.  This is also true for funds that don't end up flowing during rail settlement because rail validation fails.

### Mixing of Buckets

Schematic of the contents of the Operator approval `lockupUsage` bucket of funds

```
+-------------------+         +-------------------------------+         
| Operator Approval |         | rail 1 fixed lockup usage     |
|                   |         +-------------------------------+
|   lockupUsage     |   ==    | rail 1 streaming lockup usage |
|                   |         +-------------------------------+
|                   |         | rail 2 fixed lockup usage     |
|                   |         +-------------------------------+
|                   |         | rail 2 streaming lockup usage | 
|                   |         +-------------------------------+
|                   |         |     ...                       |
+-------------------+         +-------------------------------+
```

Schematic of the contents of the account `lockupCurrent` bucket of funds. 
Both fixed and streaming lockup from all rails of all operators are contained in the single `lockupCurrent` bucket of funds tracked in the `Account` datastructure.  Additionally temporary settling lockup waiting to be released to rail payees on rail settlement is also held in this bucket.
```
+-------------------+         +-----------------------------------+         
|      Account      |         | rail 1 (operator A) fixed lockup  |
|                   |         +-----------------------------------+
|  lockupCurrent    |   ==    | rail 1 (op A) streaming lockup    |
|                   |         +-----------------------------------+
|                   |         | rail 1 (op A) tmp settling lockup |
|                   |         +-----------------------------------+
|                   |         | rail 2 (op B) fixed lockup usage  |
|                   |         +-----------------------------------+
|                   |         | rail 2 (op B) streaming lockup    | 
|                   |         +-----------------------------------+
|                   |         | rail 2 (op B) tmp settling lockup |
|                   |         +-----------------------------------+
|                   |         |     ...                           |
+-------------------+         +-----------------------------------+
```


The payments contract has two main methods of payment: rate based payments and one time payments. Each core datastructure has a pairs of variables that seem to reflect this dichotomy: (`rateUsage`/`rateAllowance`, `lockupUsage`/`lockupAllowance`) for operator approval, (`lockupCurrent`, `lockupRate`) for accounts, and (`lockupFixed`, `paymentRate`) for rails. The payments contract does separate accounting based on rates and funds available for one time payment largely by manipulating these separate variables. But there is a big exception that shows up throughout -- the streaming lockup.

To recap from the README the streaming lockup are funds that must be locked to cover a rail's `lockupPeriod` between rail termination and rail finalization, i.e. its end of life. For motivation on the `lockupPeriod` see the README. Internally the payments contract does not consistently organize these buckets of funds separately but sometimes mixes them together. The accounting for approval and accounts *mixes these buckets* while rail accounting keeps them separate. `lockupUsage` and `lockupCurrent` both track one number that is a sum of streaming lockups for rate requirements during the `lockupPeriod` and fixed lockup for one time payment coverage.

As an example of how this manifests itself consider a call to `modifyRailPayment` increasing the payment rate of a rail.  For this operation to go through not only does the `rateAllowance` need to be high enough for the operator increase its `rateUsage`, the `lockupAllowance` must also be high enough to cover the new component of streaming lockup in the `lockupUsage`.

A more subtle manifestation of this mixing is on display with the contract's restriction of lockup modification on terminated rails. For technical reasons there is a possible delay between streaming lockup release and `lockupAllowance` reduction.  And with mixing of buckets this would open the operator to making extra one time payments using the portion of the allowance reserved for the streaming lockup.

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

Account settlement roughly speaking flows funds out of a depositing payer's account into a staging bucket (`lockupCurrent`) without completing the flow of funds to the payee -- that part is done per-rail during rail settlement.  To enable the contract to efficiently handle account settlement over many rails, accounts only maintain global state of the lockup requirements of all rails: `lockupRate`.  Accounts track deposited funds, total locked funds, rate of continuous lockup and the last epoch they were settled at.  

The Account struct 
```solidity
    struct Account {
        uint256 funds;
        uint256 lockupCurrent;
        uint256 lockupRate;
        // epoch up to and including which lockup has been settled for the account
        uint256 lockupLastSettledAt;
    }
```

The `lockupCurrent` field is the intermediate bucket holding onto funds claimed by rails.  The free funds of the account are `funds` - `lockupCurrent`.  Free funds flow into `lockupCurrent` at `lockupRate` tokens per epoch.

As noted 


## Rails and Rail Settlement


- settle rails by segments, segments are held in the `RateChangeQueue` which tracks each segment of time that has a different rate.
  - validation run for settling each segment
  - point of segments is to track minimal info for lazy settlement.  the firt time we run a settlement through time all of the rate changes will be processed and we'll have an empty queue again.
  - if there is not lazy history to go through we take the `_settleSegment` code path
  - otherwise we take `_settleWithRateChanges` which goes through the queue calling `_settleSegment` on each period with a different rate
  
- Rail settlement is confined within a range of epochs starting from last settled epoch and going up to the user defined `untilEpoch`. Settlement is internally capped at the minimum of `untilEpoch` and the maximum possible epoch that the rail can consistently be settled from.  For a non terminated rail this is the last epoch that the payer account has been settled up to, i.e. `payer.lockupLastSettledAt`. For a terminated rail this is just the rail's `endEpoch` because we are already guaratneed to have the rail's `lockupPeriod` locked into the account's `lockupCurrent` from account invariants.

- Rail settlement always tries to finalize a rail before returning. Finalization has two effects. First it has the effect of flowing unused rail fixed lockup funds out of the payer account `lockupCurrent` and back to the account's available balance. Second the operator usage for streaming lockup and unused fixed lockup is removed and the operator reclaims this allowance for lockup operations on other rails.


### One Time Payments

### Rate Changes 

I think my "bug" might be nothing because there is an invariant that rate changes are disallowed on rails that are not fully settled.  I'll need to go back and look through that.

### Validation 
- validation can modify
  - the settlement time 
  - the actual amount settled over that time 
  
- note that when the validator withholds some of the funds from settlement rail settlement still unlocks those funds from the `lockupCurrent` bucket in the payer account.  Essentially the validator flows those funds back to the payer.


## Termination

When calling settle on a terminated rail, one final round of state change is made so that the rail is considered finalized and completely finished in the system. 

An interesting thing happening in finalize is that only upon finalization do we reduce operator approval down to 0.  One half of this makes sense -- the fixed lockup.  Any of that remaining we remove.  The part that is a bit delayed is the streaming lockup.  The streaming lockup is continually paid out during the window between termination and finalization but the approval remains in place until then.  One edge case is that the operator is free to lockup more funds in fixed lockup if it is periodically rail settling out funds from the account lockup's streaming lockup portion.

However there is nothing weird you can do here because modifying lockup is constrained after a rail is terminated.  All you can do is reduce the fixed lockup.  So this approval set for the streaming lockup is actually never available for one time payments and nothing bad can really happen.  

The other thing I'm confident about is that we are never double removing an approval which would lead to constraining over withdrawal bugs with shared rails for the same operator.  For modify down and OTP we remove the lockup approval.  And during settlement of rate funds in the terminated context we don't actually ever spend our lockup allowance even though we're settling rails out of account lockup and therefore technically should be.


