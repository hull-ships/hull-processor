# CHANGELOG

## 0.2.7

- upgrade docs
- add `enteredSegment` and `leftSegment` methods

## 0.2.6

- update hull-node to v0.13.9
- adjust ci configuration and metrics

## 0.2.5

- use `_.toString` instead of custom `stringify` method in updateChanges

## 0.2.4

- pass first `anonymous_id` to asUser ident object if user has any

## 0.2.3

- Expose new Helper methods to simplify Processor code
  + isGenericEmail
  + isGenericDomain

## 0.2.2

- Fix account traits grouping
- Properly handle timeout and error on request callbacks
- Log service_api request and responses
- add `isGenericEmail` helper with a default list of generic emails
- replace help modal with link to readme

## 0.2.0

- upgrade hull-node to 0.13.2
- add smart-notifier support
- prepare supporting libraries outside per message handler to optimize time spent there
- improve error handling

## 0.1.10

- improve diff to ignore miliseconds difference on timestamps and types when comparing string/numbers

## 0.1.9

- upgrade hull-node back to latest v0.12.6

## 0.1.8

- upgrade hull-node back to latest v0.12.5

## 0.1.7

- fix hull-node version to v0.12.0

## 0.1.6

- fix hull-node version to v0.12.2

## 0.1.5

- improve error handling and logging

## 0.1.4

- fix traits update to make them case insensitive
- expose /status endpoint
- change `console.log` function behavior - it is displayed in UI preview only, not put into stdout
- introduce `console.info` which outputs it's data to both UI preview and the stdout
- restructurize the tests directories
- upgrade hull-node to 0.12.3

## 0.1.3

- use redis caching for ship and segments cache

## 0.1.2

- make sure we don't store cache without TTL

## 0.1.1

- upgrade hull-node to 0.11.12 -> hotfix batch extract timeout
- added yarn.lock file

## 0.1.0

- [feature] adds hull object scoped to the user in the sandbox
- [feature] adds account linking and traits support
- pass `email` as user identification clam whenever possible

## 0.0.2

- [hotfix] support `traits` calls which modify existing arrays on users
