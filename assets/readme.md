# Process and Transform Customer data in realtime

This ship lets you manipulate user data in realtime, to transform, enrich, compute new  properties.

Computed Traits

**This ship lets you process user data**, add & edit properties and emit new events. Users will pass through this code everytime they are updated or generate events.

**Actions are micro-batched:** The code will *not* run every time an Event is recorded, but rather wait and receive **several events at once**. When a User is recomputed, the Ship will receive it along with all the events performed since the last batch. Events are sent exactly once.

**It is up to you to avoid infinite loops: Those calls count against your quotas and can burn through it pretty quickly.**

---

<p>On the **Sidebar**, Write Javascript code to manipulate data and return a new object with the computed properties. You can't use asynchronous code, and must return an object at the end of your code.</p>
<h6>Example: </h6>

```
return {
  // Ignored. only objects are supported at top level
  name: 'Superman'

  traits: {
    // Recognized as global property, saved at top level
    name: 'Superman',

    //Increments coconuts by 2
    coconuts: { operation: 'inc', value: 2 }
  },
  // Groups are supported, 1 level only.
  shopify: {
    key: 'value'
}
```

You can apply <a target="_blank" href="http://www.hull.io/docs/references/hull_js#traits">Traits operations</a> if needed.

**Be careful to not apply trait operations unconditionally otherwise you'll end up with an infinite increment loop.**

On the **left**, is a sample user with all his/her properties, segments, latest events and changes since last recompute. You can search for a specific user.

On the **right**, a preview of the updated user, a summary of the changes that would be applied and eventual logs and errors from the console</p>

<p>When you're satisfied, click **Save**</p>
</Col>
</Col>
</Row>

<hr/>

<Row>
<Col sm={12}>
<h4>Variables and libraries you can access</h4>
<p>The code will run once saved. It will not back-process users who don't change. You can trigger a batch from the dashboard. Events won't be sent in Batches.</p>

</Col>
</Row>
<Table striped bordered condensed hover className='mt-1'>
<tbody>
<tr>
<td><code>ship</code></td>
<td>
<p><small>The Ship's data. Can be used to store additional data</small></p></td>
</tr>
<tr>
<td><code>user</code></td>
<td>
<p><small>The User data (as seen on the left side)</small></p></td>
</tr>
<tr>
<td><code>changes</code></td>
<td>
<p><small>An array of all the changed properties since last recompute</small></p></td>
</tr>
<tr>
<td><code>events</code></td>
<td>
<p><small>An array of all the events since last recompute</small></p></td>
</tr>
<tr>
<td><code>segments</code></td>
<td>
<p><small>The segments the user belongs to. </small></p></td>
</tr>
<tr>
<td><code>isInSegment('Segment')</code></td>
<td>
<p><small>A convenience method allowing you to quickly define if the user is a member of a given segment.</small></p></td>
</tr>
<tr>
<td><code>moment()</code></td>
<td>
<p><small>The <a href="http://momentjs.com/" target='_blank'>Moment.js</a> library.</small></p></td>
</tr>
<tr>
<td><code>URI()</code></td>
<td>
<p><small>The <a href="https://medialize.github.io/URI.js/" target='_blank'>URI.js</a> library.</small></p></td>
</tr>
<tr>
<td><code>_</code></td>
<td>
<p><small>The <a href="https://lodash.com/" target='_blank'>lodash</a> library.</small></
