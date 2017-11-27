# Hull Processor

The Processor enables you to run your own logic on attributes and events associated to users and leads by writing Javascript.

## Getting Started

Go to the Connectors page of your Hull organization, click the button “Add Connector” and click “Install” on the Processor card. After installation, you will be presented with the three column Dashboard layout. The left column displays the **Input** which is a user with events, segments and attributes, the middle column will hold your Javascript **Code** that transforms it to the **Output** of the right column. The Output itself displays the changed attributes of the user.
![Getting Started Step 1](./docs/gettingstarted01.png)

You can begin writing your own code right away, but you probably might want to gather some useful background information first. We recommend to start with the [execution model](#Execution-Model) which clarifies when your code is run before you move on to the data that is available as Input:

- [Account](#Input---Account)
- [Changes](#Input---Changes)
- [Events](#Input---Events)
- [Segments](#Input---Events)
- [User](#Input---User)

Read more about writing code:

- [Code basics](#Code-basics)
- [External libraries](#External-Libraries)
- [Golden Rules](#Golden-Rules)


## Features

The Hull Processor allows your team to write Javascript and transform data in Hull for users and accounts. You can emit events based of attribute changes or calculate a lead score, the Processor is your multi-tool when it comes to data in Hull.

The Processor supports to  `add traits`,  `update traits` and `create events` for both, users and accounts. Furthermore it allows you to `link accounts`.

You can use the `request` library ([https://github.com/request/request](https://github.com/request/request)) to call external services or send data to webhooks.

## Execution Model

Before writing your first line of code, it is vital to have a good understanding when this code will be executed:

- The Processor runs on micro-batched data, which means that not every changed attribute and newly added event will lead to a run of the Processor.
- The Processor receives events exactly once, or in other words the exposed events are the ones between now and the last run of the Processor.

## Input - Account

The account object consists of a flat trait hierarchy in contrast to the user object in Hull. This means you can access all traits directly by their name, e.g. to get the name of an account, just use `account.name` in the code.
Accounts do have various identifiers: the Hull ID (`account.id`), an External ID (`account.external_id` ) and Domain (`account.domain`).
The following snippet shows an example of an account:

```javascript
    {
      account: {
        id: "7ad5524d-14ce-41fb-8de4-59ba9ccf130a",
        external_id: "8476c4c7-fe7d-45b1-a30d-cd532621325b",
        domain: "hull.io",
        name: "Hull Inc.",
        ... // more attributes in flat hierarchy
      },
      [...] // omitted for clarity
    }
```

Please note that the `external_id` is only present if the account has been created via another connector such as the SQL importer or Segment.

## Input - Changes

The `changes` object represents all changes to a user that triggered the execution of this processor and contains information about all modified data since the last re-compute of the user. Changes itself is an object in Javascript which exposes the following top-level properties:

- `changes.is_new` indicates whether the user created is new and has just been created or not.
- `changes.segments`, which holds all segments the user has entered and left since the last recompute, accessible via `changes.segments.entered` and `changes.segments.left`. Each segment is an object itself composed of the following properties `created_at` , `id`, `name`, `type`and `updated_at`.
- `changes.user` which is an object that is exposes each changed attribute as property that value is an array. The array has the old value as the first argument and the new one as the second. For example, if the email is set the first time, you can access it via `changes.user.email` and the value will look like this `[null,` `"``test@hull.io``"``]`.

The following code shows an example of changes:

```javascript
    {
      changes: {
        is_new: false,
        segments: {
          entered: [
            {
              created_at: "2017-09-01 09:30:22.458Z",
              id: "dfbdd69d-1e6d-4a58-8031-c721a88f71f6",
              name: "All Leads",
              type: "user",
              updated_at: "2017-09-01 10:04:01.938Z",
            },
            // more segments if applicable
          ],
          left: [
            // omitted for brevity
          ]
        },
        user: {
          newsletter_subscribed: [false, true],
          first_name: [null, "John"],
          last_name: [null, "Doe"]
        }
      }
    }
```

## Input - Events

The `events` object holds all events that have occurred since the last re-compute of the user. It is an array of objects, that has a couple of key attributes as explained below. You shouldn’t rely on the fact that these attributes are present for every event.

The `event.event` attribute holds the name of the event itself while `event.event_source` and `event.event_type` provide you some information where the event came from and what type the event is of. The `event.context` property provides you data about the environment of the event, such as the url, session and timestamp. The `event.properties`  of the event provide you access to all attributes of the event. Both, `event.context`  and `event.properties`, depend heavily on the event, so you should code defensively when accessing this data.

The following code shows an example payload of events:

```javascript
    {
      "events": [
        {
          "event": "Viewed ships",
          "created_at": "2017-09-18T12:18:04Z",
          "properties": {
            "action": "PUSH"
          },
          "event_source": "track",
          "event_type": "track",
          "context": {
            "location": {
              "latitude": 99,
              "longitude": 99
            },
            "page": {
              "url": "https://dashboard.hullapp.io/super/ships"
            }
          }
        }
      ]
    }
```

## Input - Segments

You can access the segments a user belongs to via `segments` which is an array of objects itself. Each segment object has an identifier and name that can be accessed via `id` and `name` and metadata such as `type`, `updated_at` and `created_at`.

The following code shows an example of the `segments` data:

```javascript
    {
      "segments": [
        {
          "id": "59b14b212fa9835d5d004825",
          "name": "Approved users",
          "type": "users_segment",
          "updated_at": "2017-09-07T13:35:29Z",
          "created_at": "2017-09-07T13:35:29Z"
        },
        {
          "id": "5995ce9f38b35ffd2100ecf4",
          "name": "Leads",
          "type": "users_segment",
          "updated_at": "2017-08-17T17:13:03Z",
          "created_at": "2017-08-17T17:13:03Z"
        },
        // additional segments
      ]
    }
```

## Input - User

The `user` object provides you access to all attributes of the currently computed user. You have access to three different kinds of attributes, top-level, ungrouped and grouped traits.

Top-level attributes are directly accessible via `user.name` for example, while ungrouped attributes are accessible via `user.traits.my_trait` and grouped attributes can be used via `user.salesforce_contact.email`.

You can inspect the user object shown in the Input (left column) to inspect the different attributes of the user. You can search for a particular user in the Input by entering the email address or Hull ID into the search field.

```javascript
    {
      "accepts_marketing": false,
      "anonymous_ids": [
        "1493661119-49ee68ac-1z58-4r3l-n8ba-2x22wb3762g9",
        "intercom:5907854a8ez91d591a49b4c2",
        "hubspot:999999",
        // additional identifiers
      ],
      "created_at": "2017-05-01T19:06:04Z",
      "domain": "hull.io",
      "email": "johnny@hull.io",
      "external_id": "2107091ci8babc17z10017d8",
      "first_name": "John",
      "first_seen_at": "2017-05-01T17:51:52Z",
      "first_session_initial_referrer": "",
      "first_session_initial_url": "http://www.hull.io/",
      "first_session_platform_id": "558979x8v29537a316",
      "first_session_started_at": "2017-05-01T17:51:52Z",
      "has_password": true,
      "id": "5907871cy3bdae94k10017p3",
      "identities_count": 0,
      "is_approved": true,
      "last_known_ip": "8.8.8.8",
      "last_name": "Doe",
      "last_seen_at": "2017-09-25T11:54:50Z",
      "latest_session_initial_referrer": "",
      "latest_session_initial_url": "https://dashboard.hullapp.io/",
      "latest_session_platform_id": "558979x8v29537a316",
      "latest_session_started_at": "2017-09-25T11:53:52Z",
      "main_identity": "external",
      "name": "John Doe",
      "picture": "<URL>", // the gravatar URL
      "signup_session_initial_referrer": "",
      "signup_session_initial_url": "http://www.hull.io/",
      "signup_session_platform_id": "558979x8v29537a316",
      "signup_session_started_at": "2017-05-01T17:51:52Z",
      "traits": {
        "company_name": "Hull Inc",
        "matching_technologies": 3,
        "request_demo": false,
        "unified_domain": "hull.io"
      },
      "hubspot": {
        "created_at": "2017-01-22T18:52:08+00:00",
        "email_optout": "",
        "hs_sales_email_last_opened": "1495839471456",
        "hubspot_owner_id": "9999999",
        "id": 999999,
        "owner_assigned_at": "2017-01-22T18:52:08+00:00",
        "updated_at": "2017-05-26T22:57:56+00:00"
      }
      "intercom": {
        "anonymous": false,
        "avatar": "<URL>", // URL for avatar
        "companies": [ "Hull" ],
        "created_at": "2017-05-01T18:58:23+00:00",
        "id": "5907854x5ze61g395b10b3d7",
        "last_request_at": "2017-09-21T10:52:30+00:00",
        "last_seen_ip": "8.8.8.8",
        "location_city_name": "Atlanta",
        "location_continent_code": "US",
        "location_country_code": "USA",
        "location_country_name": "United States",
        "location_latitude": 10.0833,
        "location_longitude": 10.9167,
        "location_postal_code": "30305",
        "location_region_name": "Georgia",
        "location_timezone": "America/NewYork",
        "name": "John Doe",
        "pseudonym": "Amber Turtle from Atlanta",
        "segments": [],
        "session_count": 416,
        "signed_up_at": "2017-05-01T19:06:04+00:00",
        "tags": [],
        "unsubscribed_from_emails": false,
        "updated_at": "2017-09-25T08:07:39+00:00"
      },
      "salesforce_lead": {
        "company": "Hull Inc",
        "email": "johnny@hull.io",
        "first_name": "John",
        "id": "00Z39100002XipQXZZ",
        "last_name": "Doe",
        "owner_id": "09315080000TSgjBAM",
        "pi__campaign__c": "Segmentation Checklist",
        "status": "New"
      },
      "indexed_at": "2017-09-25T11:54:58+00:00",
      "segments": [
        {
          "id": "56a7904e8d3714a04c0000da",
          "name": "Active Users",
          "type": "users_segment",
          "created_at": "2016-01-26T15:27:10Z",
          "updated_at": "2016-01-26T15:27:10Z"
        },
        // skipped
        ]
    }
```

## Code basics

You can access the **input data** as described above, here is the summary of available Javascript objects:

| Variable Name                      | Description                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------------ |
| `account`                          | Provides access to the account’s attributes.                                   |
| `changes`                          | Represents all changes in user attributes since the last re-computation.       |
| `events`                           | Gives you access to all events **since the last re-computation.**                  |
| `segments`
or
`account_segments` | Provides a list of all segments the user belongs to
or
the account belongs to. |
| `user`                             | Provides access to the user’s attributes.                                      |

Please note that some of the input data shown on the left might be fake data that showcases additional fields available in your organization but that might not be applicable to all users.

In addition to the input, you can also access the **settings** of the processor:

|**Variable Name**| **Description**                                                                                                                                                |
|-----------------| ---------------------------------------------------------------------------------------------------------------------------------------------------------------|
|`ship`           | Provides access to processor settings, e.g. `ship.private_settings` gives you access to the settings specified in `manifest.json` as shown in the Advanced tab.|

Now that you have a good overview of which variables you can access to obtain information, let’s move on to the functions that allow you to **manipulate data**.

### Setting and updating User attributes

Lets first explore how you can **change attributes for a user**. As you already know from the Input - User section above, there are three types of attributes, top-level, ungrouped and grouped attributes. ***Top-level and ungrouped attributes*** can be set with the not-overloaded function call

```javascript
  hull.traits({ ATTRIBUTE_NAME: <value> })
```

For naming conventions, see the Golden Rules section below.

Of course you can set multiple attributes at once by passing a more complex object like:

```javascript
  hull.traits({ ATTRIBUTE_NAME: <value>, ATTRIBUTE2_NAME: <value> })
```

Using this function signature, these attributes are stored in the `traits` attributes group.

### Attribute Groups

If you want to make use of ***grouped attributes***, you can use the overloaded signature of the function, passing the group name as source in the second parameter:

```javascript
  hull.traits({ ATTRIBUTE_NAME: <value> }, { source: <group_name> })
```

If you want to “delete” an attribute, you can use the same function calls as described above and simply set `null`  as value.

### Incrementing and decrementing values (Atomic Operations)

Given the distributed nature of computation, if you want to increment or decrement a counter, you need to take special care. Since the code might run multiple times in parallel, the following operation will not be reliable:

```
  hull.traits({ coconuts: user.coconuts+1 });
```

To get reliable results, you need to use `atomic operations`. Here's the correct way to do so:

```
 hull.traits({ coconuts: { operation: 'inc', value: 1 } })
```

Where:
- Operation: `inc`, `dec`, `setIfNull`
- Value: The value to either increment, decrement or set if nothing else was set before.

## Tracking new events

Now that we know how to handle attributes, let’s have a look at how to **emit events for a user**. You can use the `hull.track` function to emit events, but before we go into further details be aware of the following:

_The `hull.track` call needs to be always enclosed in an `if` statement and we put a limit to maximum 10 tracking calls in one processor. If you do not follow these rules, you could end up with a endless loop of events that counts towards your plan quota._

Here is how to use the function signature:

```js
  hull.track( "<event_name>" , { PROPERTY_NAME: <value>, PROPERTY2_NAME: <value> })
```

The first parameter is a string defining the name of the event while the second parameter is an object that defines the properties of the event.

Now that we know how to deal with users, let’s have a look how to handle accounts.

You can **link an account to the current user** by calling the `hull.account` function with claims that identify the account. Supported claims are `domain`, `id` and `external_id`. To link an account that is identified by the domain, you would write

```js
  hull.account({ domain: <value> })
```

which would either create the account if it doesn’t exist or link the current user to the existing account.

To **change attributes for an account**, you can use the chained function call `hull.account().traits()`. If the user is already linked to an account, you can skip passing the claims object in the `hull.account()`  function and the attributes will be applied to the current linked account. By specifying the claims, you can explicitly address the account and if it is not linked to the current user, the account will be linked and attributes will be updated.
In contrast to the user, accounts do only support top-level attributes. You can specify the attributes in the same way as for a user by passing an object into the chained `traits` function like

```js
  hull.account().traits({ ATTRIBUTE_NAME: <value>, ATTRIBUTE2_NAME: <value> })
```

You can specify the properties of the event by passing them as object in the second parameter: `hull.account().track(<event_name>, {PROPERTY_NAME:<value>, PROPERTY2_NAME:<value>})`
Make sure to encapsulate the `track`  call in a conditional `if` statement, otherwise you end up with an infinite loop that counts towards your plan’s quota.

### Limitations
The Platform refuses to associate Users in accounts with a domain being a Generic Email Domain - See the list of email domains we refuse here: https://github.com/hull-ships/hull-processor/blob/develop/server/email-domains.js - This helps preventing accounts with thousands of users under domains like `gmail.com` because you'd have written the following code:

```js
 // Any user with a "gmail.com" account would be linked to this account
 hull.account({ domain: user.domain })
```

### Understanding the logic behind Accounts, Preventing Infinite Loops
Let's review a particularly critical part of Accounts:

Here's a scenario that, although it seems intuitive, will **generate an infinite loop** (which is bad. You don't want that). Let's say you store the MRR of the account at the User level and want to use Hull to store it at account level. Intuitively, you'd do this:

```js
  hull
    .account() //target the user's current account
    .traits({
      //set the value of the 'is_customer' attribute to the user's value
      mrr: user.traits.mrr
    })

```

Unfortunately, it's enough for 2 users in this account to have different data to have the account go into an infinite loop: 

```
User1 Update
  → Set MRR=100
    → Account Update
      → User2 Update
        → Set MRR=200
          → Account Update
            → User Update
              → Set MRR=100 → Account Update 
etc...
```

The way you solve this is by either doing a `setIfNull` operation on the account, so that the first user with a value defines the value for the account and it's not updated anymore, or you rely on the `changes` object to only change the Account when the value for the user changed:

```js
  const mrr = _.get(changes, 'user.traits.mrr')
  //There was an MRR change on the User
  if(mrr && mrr[1]) {
    //report the new MRR on the Account
    hull.account().traits({ mrr: mrr[1] });
  }
```

Or you could rely on a User Event if you have such events"

```js
events.map(event => {
  if (event.event === "MRR Changed") {
    hull.account().traits({ mrr: event.properties.mrr });
  }
});
```

## Utility Methods
The processor provides the following methods to help you:

| **Function Name**                                  | **Description**                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `isInSegment(<name>)`                              | Returns `true` if the user is in the segment with the specified name; otherwise `false`. Please note that the name is case-sensitive.                                                                                                                                                  |
| `isGenericEmail(<email>, <[additional-domains]>)`  | Returns `true` if the user uses a generic email host. The list of email providers we check against is here: https://github.com/hull-ships/hull-processor/blob/develop/server/email-domains.js. `additional-domains` is an array of strings for additional domain names to check against|
| `isGenericDomain(<domain>, <[additional-domains]>)`| Returns `true` if the user uses a generic email host. The list of email providers we check against is here: https://github.com/hull-ships/hull-processor/blob/develop/server/email-domains.js. `additional-domains` is an array of strings for additional domain names to check against|


## External Libraries

The processor exposes several external libraries that can be used:

|**Variable**| **Library name**                                                  |
|------------| ------------------------------------------------------------------|
|`_`         | The lodash library. (https://lodash.com/)                         |
|`moment`    | The Moment.js library(https://momentjs.com/)                      |
|`urijs`     | The URI.js library (https://github.com/medialize/URI.js/)         |
|`request`   | The simplified request client (https://github.com/request/request)|

Please visit the linked pages for documentation and further information about these third party libraries.

## Golden Rules

- DO use snake_case rather than camelCase in your naming.
- DO write human readable keys for traits. Don’t use names like `ls` for lead score, just name it `lead_score`.
- DO use `_at` or `_date` as suffix to your trait name to let hull recognize the values as valid dates. You can pass either
  - a valid unix timestamp in seconds or milliseconds or
  - a valid string formatted according to ISO-8601
- DO make sure that you use the proper type for new traits because this cannot be changed later. For example, if you pass `"1234"` as the value for trait `customerId`, the trait will be always a treated as string, even if you intended it to be a number.
- DO NOT write code that generates dynamic keys for traits
- DO NOT use large arrays because they are slowing down the compute performance of your data. Arrays with up to 50 values are okay.
- DO NOT create infinite loops because they count towards the limits of your plan. Make sure to guard emitting events with `track` calls and to plan accordingly when setting a trait to the current timestamp.

## Debugging and Logging

When operating you might want to log certain information so that it is available for debugging or auditing purposes while other data might be only of interest during development. The processor allows you to do both:

- `console.log` is used for development purposes only and will display the result in the console of the user interface but doesn’t write into the operational logs.
- `console.info` is used to display the result in the console of the user interface and does also write an operational log.

You can access the operational logs via the tab “Logs” in the user interface. The following list explains the various log messages available:

| **Message**                | **Description**                                                                                                                                                                                                               |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compute.console.info`     | The manually logged information via `console.info`.                                                                                                                                                                           |
| `incoming.user.start`      | Logged when the computation of a user is started.                                                                                                                                                                             |
| `incoming.user.success`    | Logged after attributes of a user have been successfully computed.                                                                                                                                                            |
| `incoming.user.skip`       | Logged if the user hasn’t changed and there is no computation necessary.                                                                                                                                                      |
| `incoming.account.success` | Logged after attributes of an account have been successfully computed.                                                                                                                                                        |
| `incoming.account.link`    | Logged after the user has been successfully linked with an account.                                                                                                                                                           |
| `incoming.user.error`      | Logged if an error is encountered during compute. The data of the error provides additional information whether the error occurred in the sandboxed custom code or in the processor itself (see boolean value for `sandbox`). |

If an error is encountered in the processor code itself, the error object contains additional information:

| Message                     | Description                                                          |
| --------------------------- | -------------------------------------------------------------------- |
| `fetch.user.events.error`   | Indicates problems when fetching events data for the current user.   |
| `fetch.user.segments.error` | Indicates problems when fetching the segments the user is part of.   |
| `fetch.user.report.error`   | Indicates problems when fetching report data about the current user. |
| `fetch.user.error`          | Indicates problems when fetching data about the current user.        |
