# CHANGELOG

## 0.2.30
- remove use of hull.js on load

## 0.2.29
- updated a few libraries with security vulnerabilities

## 0.2.28
- version bump of hull node

## 0.2.26
- `undefined` traits are discarded from the changes diff

## 0.2.25
- add kraken-exports tag

## 0.2.24
- updated status for processor to conform with product standard
- fixed bug where you couldn't set a blank string to null

## 0.2.23
- add support for searching by external_id in the Code editor

## 0.2.22
- upgrade hull-node

## 0.2.21
- prevent flatmap-stream@0.1.1 from installing

## 0.2.20
- Embed the full, real context from User Events when we receive them

## 0.2.19
- Exclude `account` object from `user.changes` preview
- Add actual `changes.account` and `changes.account_segments` and top-level `account_segments` objects`
- preview data flow fixes

## 0.2.18
- update hull version to 0.13.14

## 0.2.17
- do not reuse sandbox between users of the same batch
- add `connector.service_api.call`, `connector.service_api.response_time` and `connector.service_api.error` metrics for HTTP requests
- deepClone all information passed to logger to prevent mutation
- add request tests

## 0.2.16
- add memory optimization node runtime flags and upgrade hull-connector-tester

## 0.2.15
- upgrade to node v8.10.0

## 0.2.14

- [improvement] Upgrade code to node v8.9.x LTS release
- [improvement] Use customizable tabs for code editor
- [bugfix] Fix failing code syntax check
- [bugfix] Fix failing initial user load
- [maintenance] Re-factoring of code base for better readibility and maintainability
- [maintenance] Additional tests for linting and syntax checking of more complex code
- [maintenance] Exclude selected events from `events` array (see README.md Notes section for details)

## 0.2.13

- Don't display Attributes changed, Segments changed, Entered & Left segments events in the preview UI

## 0.2.12

- Group `incoming.user.start` and `incoming.user.skip` logs

## 0.2.11

- Fine grained changes detection on empty object values for new keys

## 0.2.10

- Fine grained changes detection on nil values for new keys
- Fix fetchUser by id in preview mode

## 0.2.9

- Enable compression for outgoing data

## 0.2.8

- add Linter, cleanup error messages
- add status checks
- update dependencies
- now also shows unchanged but touched traits

## 0.2.7

- upgrade docs
- add `enteredSegment` and `leftSegment` methods

## 0.2.6

- update hull-node to v0.13.9
- adjust ci configuration
- improve user feedback on any error during search

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
