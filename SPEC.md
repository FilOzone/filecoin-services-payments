# Payments Contract In Depth Implementation SPEC 

This document exists as a supplement to the very thorough and useful README. The README covers essentially everything you need to know as a user of the payments contract. This document exists for very advanced users and implementers to cover the internal workings of the contract in depth. You should understand the README first before reading this document.

- [Skeleton Keys for Understanding](#keystones-for-understanding]
	- [Mixing of Buckets](#mixing-of-buckets)
	- [Invariants Enforced Eagerly](#invariants-enforced-eagerly)
- [Operator Approval](#operator-approval)
- [Account Settlement](#account-settlement)
- [Rail Settlement](#rail-settlement)
- [Rail States](#rail-states)
- [Validation](#validation)


## Skeleton Keys for Understanding 

Some concepts are a bit tricky and show up throughout the code in subtle ways. Once you understand them it makes things easier.

### Mixing of Buckets

The payments contract has two main methods of payment: rate based and one time. There are also many pairs of variables that seem to refelct this dichotomy: (`rateAllowance`, `lockupAllowance`) for operator approval, (`lockupCurrent`, `lockupRate`) for accounts, and (`lockupFixed`, `paymentRate`) for rails. Roughly this is correct. The payments contract does accounting based on rates and funds available for one time payment largely by manipulating these separate variables. But there is a big exception that shows up throughout because of the Payment Stream Lockup. 

To recap from the README the Payment Stream Lockup are a bucket of funds that must be locked to cover a rail's `lockupPeriod` (for motivation see the README). Internally the payments contract does not consistently organize this bucket of funds separately but sometimes mixes it in with its accounting for fixed lockup. In particular the accounting for approval and accounts *mixes buckets* while rail accounting keeps them separate. `lockupAllowance` and `lockupCurrent` are tracking numbers that apply to payment stream lockup as well as fixed lockup for one time payments.

As an example of how this manifests itself this is the cause of the counterintuitive fact that for all changes increasing payment rates, i.e. in calls to `modifyRailPayment`, require the `lockupAlowance` piece of the operator approval to be above a certain threshold. 

### Invariants Enforced Eagerly

The most pervasive pattern in the payments contract is the usage of pre and post condition modifiers. The bulk of these modifier calls force invariants to be true. The major invariant being enforced is that accounts are always settled as far as possible. Additionally there are invariants making sure that rails don't attempt to spend more than their fixed lockup, and that rails are in a particular termination state.

Every interesting function modifying the state of the payments contract runs a group of core account settlement related invariant pre and post conditions via the `settleAccountLockupBeforeAndAfter` or the `settleAccountLockupBeforeAndAfterForRail` modifier. This is a critical mechanism to be aware of when reasoning through which invariants apply during the execution of payments contract methods.

## Operator Approval

As describe above operator approvals consist of the pair of `rateAllowance` and `lockupAllowance`.  Approvals are per operator and rate and lockup resource usage are summed across all of an operator's rails when checking for sufficient operator approval during rail operations.  Approvals technically also include a `maxLockupPeriod` restricting the operator's ability to make lockup period too long.

An important counterintuitive fact about the approval allowances is that they are not constrained in relation to current usage. Usage can be lower if an operator has not used all of their existing allowance. Usage can be higher if a client has manually reduced the operator's allowance. As expounded upon in the README reducing allowance below usage on any of the allowance resources (rate, lockup, period) will not impact existing rails. Allowance invariants are checked at the point in time of rail modification not continuously enforced. Furthermore reductions in usage always go through even if the current allowance is below the new usage. For example if a rail has an allowance of 20 locked tokens and uses all of them, then the client brings allowance for the operator down to 1 locked token the operator can still modify the rail down to 15 locked tokens even though it exceeds the operator's current allowance.

Another quirk of the allowance system is the difference with which rate changes and one time payments impact the lockup allowance. When modifying a rail's rate change down, say from 5 tokens a block to 4 tokens a block, the operator's lockup approval usage can go down by 1 token * `lockupPeriod` to account for the reduction in streaming lockup. Now the operator can leverage this reduced usage to modify payments upwards in other rails. For one time payments this is not true. When a one time payment clears the approval lockup usage goes down, but additionally the `lockupAllowance` also goes down limiting the operator from doing this again. This is essential for the payments sytem to work correctly, otherwise 1 token of `lockupAllowance` could be used to spend an entire accounts funds in repeated one time payments.

## Account Settlement
 * (covered in more detail below). Account settlement roughly speaking flows funds out of a depositing payer's account into a staging bucket without completing the flow of funds to the payee -- that part is done during rail settlement.
