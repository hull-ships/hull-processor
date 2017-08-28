# 0.1.4
- fix traits update to make them case insensitive
- expose /status endpoint
- change `console.log` function behavior - it is displayed in UI preview only, not put into stdout
- introduce `console.info` which outputs it's data to both UI preview and the stdout
- restructurize the tests directories
- upgrade hull-node to 0.12.3

# 0.1.3
- use redis caching for ship and segments cache

# 0.1.2
- make sure we don't store cache without TTL

# 0.1.1
- upgrade hull-node to 0.11.12 -> hotfix batch extract timeout
- added yarn.lock file

# 0.1.0
- [feature] adds hull object scoped to the user in the sandbox
- [feature] adds account linking and traits support
- pass `email` as user identification clam whenever possible

# 0.0.2
- [hotfix] support `traits` calls which modify existing arrays on users
