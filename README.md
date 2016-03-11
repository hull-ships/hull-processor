
# Hull Segment Ship.

Sends Hull data to [Segment](http://segment.com).

If you want your own instance: [![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/hull-ships/hull-segment)

End-Users: [See Readme here](https://dashboard.hullapp.io/readme?url=https://hull-segment.herokuapp.com)
---

### Using :

- Go to your `Hull Dashboard > Ships > Add new`
- Paste the URL for your Heroku deployment, or use ours : `https://hull-segment.herokuapp.com/`
- Enter the Segment Write Key
- Visit the Setup Page (see below)
- Add your ship to a Platform.

### Developing :

- Fork
- Install

```sh
npm install -g gulp
npm install
gulp
```

# Secret Exchange:

Go to your console in the Hull Dashboard and type:

```
Hull.api({
  path: 'SHIP_ID/secret',
  provider:'admin',
  organization:'ORG_NAMESPACE'
})
```

Get the secret, paste in there:

`http://hull-segment.herokuapp.com/install?org=a239c5b2.hullbeta.io&id=SHIP_ID&secret=SHIP_SECRET`
