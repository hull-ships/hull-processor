
# Hull Processor Ship.

Run code to update User Properties and generate Events whenever Users are updated or perform events.

If you want your own instance: [![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/hull-ships/hull-processor)

End-Users: [See Readme here](https://dashboard.hullapp.io/readme?url=https://hull-processor.herokuapp.com)
---

### Using :

- Go to your `Hull Dashboard > Ships > Add new`
- Paste the URL for your Heroku deployment, or use ours : `https://hull-processor.herokuapp.com/`

### Developing :

- Fork
- Install

```sh
npm install -g gulp
npm install
gulp
```

### Notes

1. Due to merging and diff calculating strategy, following use scenario can lead to an unexpected result:
    ```js
    user.traits.custom_ids = ["A", "B", "C"];
    traits({ custom_ids: ["A", "B"] });
    // processor ignores removing that array element
    ```

### Logs

  These are log messages that are specific for Processor Connector :
    info :

      * compute.user.computed - logged after successful computing traits about user in user-update
      * compute.account.computed - logged after successful computing traits about account in user-update
      * compute.account.link - logged after successful linking for account
      * compute.user.computed - logged after successful computing
      * compute.user.error - logged when encountered error during compute operation
      * compute.console.log - these are additional logs that should be displayed after compute
      * compute.error - general logging about errors that encountered during updating user

    error :
      * fetch.user.events.error - logged when encountered error during user events fetch
      * fetch.user.segments.error - logged when encountered error during user segments fetch
      * fetch.user.report.error - logged when encountered problems during search for user reports
      * fetch.user.error - logged when encountered error during user fetch

