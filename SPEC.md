# Payments Contract In Depth Implementation SPEC 

This document exists as a supplement to the very thorough and useful README. The README covers essentially everything you need to know as a user of the payments contract. This document exists for very advanced users and implementers to cover the internal workings of the contract in depth. You should understand the README first before reading this document.

- [Skeleton Keys for Understanding](#keystones-for-understanding]
	- [Mixing of Buckets](#mixing-of-buckets)
	- [Accounts Settle Eagerly](#accounts-settle-eagerly)

- [Operator Approval](#operator-approval)
- [Account Settlement](#account-settlement)
- [Rail Settlement](#rail-settlement)
- [Rail States](#rail-states)
- [Validation](#validation)


## Skeleton Keys for Understanding 

Some concepts are a bit tricky and show up throughout the code in subtle ways. Once you understand them it makes things easier.

### Mixing of Buckets

The payments contract has two main methods of payment: rate based and one time. There are also many pairs of variables that seem to refelct this dichotomy: (`rateAllowance`, `lockupAllowance`) for operator approval, (`lockupCurrent`, `lockupRate`) for accounts, and (`lockupFixed`, `paymentRate`) for rails. Roughly this is correct. The payments contract does accounting based on rates and funds available for one time payment largely by manipulating these separate variables. But there is a big exception that shows up throughout because of the Payment Stream Lockup. 

To recap from the README the Payment Stream Lockup are a bucket of funds that must be locked to cover a rail's `lockupPeriod` (for motivation see the README). Internally the payments contract does not consistently organize this bucket of funds separately but sometimes mixes it in with its accounting for fixed lockup. In particular the accounting for approval and accounts *mixes buckets* while rail accounting keeps them separate. `lockupAllowance` and `lockupCurrent` are tracking numbers that apply to payment stream lockup as well as fixed lockup for one time payments

As an example of how this manifests itself this is the cause of the counterintuitive fact that for all changes increasing payment rates, i.e. in calls to `modifyRailPayment`, require the `lockupAlowance` piece of the operator approval to be above a certain threshold. 

# Operator Approval

Like much of the rest of the payments contract operator approvals are a pair of numbers. The first of this pair is the `rateAllowance` a token/epoch rate allowance constraining total payments flowing through rails. The second is the `lockupAllowance` constraining how much total funds can be locked in rails. Approvals are per operator and rate and lockup resource usage are summed across all of an operator's rails when checking for sufficient operator approval during rail operations. One counterintuitive fact is that the all changes to payment rates, i.e. in calls to `modifyRailPayment`, require both the allowances to be above a certain threshold. The reason for this is that 


