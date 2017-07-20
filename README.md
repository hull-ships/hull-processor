
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
      * compute.console.log - these are additional logs that should be displayed after compute
      * incoming.user.start - logged when a user start being computed
      * incoming.user.success - logged after successful computing traits about user in user-update
      * incoming.user.skip - logged if user hasn't been changed at at all.
      * incoming.account.success - logged after successful computing traits about account in user-update
      * incoming.account.link - logged after successful linking for account
      * incoming.user.error - logged when encountered error during compute operation (sandbox boolean shows if the error occured inside the sandbox code or in the processor code itself)

    error :
      * fetch.user.events.error - logged when encountered error during user events fetch
      * fetch.user.segments.error - logged when encountered error during user segments fetch
      * fetch.user.report.error - logged when encountered problems during search for user reports
      * fetch.user.error - logged when encountered error during user fetch

