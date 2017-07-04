
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

* preview.console.log - logging each log that arrived in compute handler
* compute.user.computed - logged after successful computing traits in user-update
* compute.account.computed - logged after successful updating traits in user-update
* compute.account.link - logged after successful linking for account