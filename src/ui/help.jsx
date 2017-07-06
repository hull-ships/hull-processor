import React, { Component } from "react";
import { Alert, Modal, Tooltip, Button, Popover, OverlayTrigger, Row, Col, Table} from "react-bootstrap";
import Icon from './icon';

export default class Help extends Component {

  constructor(props) {
    super(props);
    this.state = { showModal: false, ...props };
  }

  close() {
    this.setState({ showModal: false });
  }

  open() {
    this.setState({ showModal: true });
  }

  render() {
    const sample = `
console.log(\`Hello \$\{user.name}\`);
hull.traits({ coconuts: 12, swallows: 12 });
hull.traits({ coconuts: 13 });
hull.traits({ coconuts: 14 }, { source: 'clearbit' });

//BEWARE - if you apply a trait operation (such as 'inc')
//without a if() condition, you trigger an infinite loop;
hull.traits({ swallows: { operation: 'inc', value: 2 } });

//BEWARE - if you hull.track() without a if() condition
//you trigger an infinite loop.
if(false) { hull.track("Viewed Monthy Python", { coconuts: 12 });}
    `;
    return (
      <div>
        <Button bsStyle="warning" bsSize="sm" clasName='btn-pill btn-rounded' onClick={this.open.bind(this)} > Help </Button>

        <Modal show={this.state.showModal} bsSize='large' onHide={this.close.bind(this)}>
          <Modal.Header closeButton>
            <Modal.Title><div className='text-center'>Data Processor</div></Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
              <Col md={10} mdOffset={1}>
                <Row>
                  <Col xs={3} sm={2}>
                    <p>
                      <Icon name='calculator' responsive/>
                    </p>
                  </Col>
                  <Col xs={9} sm={10}>
                    <p>
                      <strong>This ship lets you process user data</strong>, add & edit properties and emit new events.
                      Users will pass through this code everytime they are updated or generate events.
                    </p><p>
                      <strong>Actions are micro-batched:</strong> The code will <i>not</i> run every time an Event is recorded, but rather wait and receive <strong>several events at once</strong>. When a User is recomputed, the Ship will receive it along with all the events performed since the last batch. Events are sent exactly once.
                    </p>
                    <Alert bsStyle="danger">
                      It is up to you to avoid infinite loops: Those calls count against your quotas and can burn through it pretty quickly.
                    </Alert>
                  </Col>
                </Row>

                <hr/>

                <Row>
                  <Col sm={8}>
                    <p><Icon name='compute' large/></p>
                    <p>On the <strong>Sidebar</strong>, Write Javascript code to manipulate data, call <code>hull.track()</code> and <code>hull.traits()</code> to update User. ES6 is supported. You can't use asynchronous code and external libraries.</p>
                    <h6>Example: </h6>
                    <pre>
                      <small>
                        <code>{sample}</code>
                      </small>
                    </pre>
                    <p>
                      <small>
                        You can apply <a target="_blank" href="http://www.hull.io/docs/references/hull_js#traits">Traits operations</a>.
                        <Alert bsStyle="danger">Be careful to not apply trait operations unconditionally otherwise you'll end up with an infinite increment loop.</Alert>
                      </small>
                    </p>
                    <p>
                      <small>
                        You can emit up to 10 events with <a target="_blank" href="http://www.hull.io/docs/references/hull_js#track">hull.track()</a>.
                        <Alert bsStyle="danger">Be careful to not generate events unconditionally otherwise you'll end up with an infinite loop of events and recomputations.</Alert>
                      </small>
                    </p>
                  </Col>
                  <Col sm={4}>
                    <Col sm={12}>
                      <p><Icon name='rocker' large/></p>
                      <p>On the <strong>left</strong>, is a sample user with all his/her properties, segments, account, latest events and changes since last recompute. You can search for a specific user. </p>
                    </Col>
                    <Col sm={12}>
                      <p><Icon name='punker' large/></p>
                      <p>On the <strong>right</strong>, a preview of the updated user, a summary of the changes that would be applied and eventual logs and errors from the console</p>

                      <p>When you're satisfied, click <strong>Save</strong></p>
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
                      <td><p><small>The Ship's data. Can be used to store additional data</small></p></td>
                    </tr>
                    <tr>
                      <td><code>user</code></td>
                      <td><p><small>The User data (as seen on the left side)</small></p></td>
                    </tr>
                    <tr>
                      <td><code>account</code></td>
                      <td><p><small>The User Account data (as seen on the left column)</small></p></td>
                    </tr>
                    <tr>
                      <td><code>changes</code></td>
                      <td><p><small>An object of all the changed properties since last recompute</small></p></td>
                    </tr>
                    <tr>
                      <td><code>events</code></td>
                      <td><p><small>An array of all the events since last recompute</small></p></td>
                    </tr>
                    <tr>
                      <td><code>segments</code></td>
                      <td><p><small>The segments the user belongs to. </small></p></td>
                    </tr>
                    <tr>
                      <td><code>account_segments</code></td>
                      <td><p><small>An Array of the segments the user's account belongs to. </small></p></td>
                    </tr>

                    <tr>
                      <td><code>hull.traits(properties, context)</code></td>
                      <td><p><small><a href="http://www.hull.io/docs/references/hull_js#traits" target="_blank">Update User Traits</a>. Optionally define a context with a <code>source</code> key to save in a custom group</small></p></td>
                    </tr>

                    <tr>
                      <td><code>hull.track('Event Name', properties)</code></td>
                      <td><p><small>Lets you <a href="http://www.hull.io/docs/references/hull_js#track" target="_blank">generate new Events</a> for the user.</small></p></td>
                    </tr>

                    <tr>
                      <td><code>hull.account(claims)</code></td>
                      <td><p><small>A method to link the Account claimed to this User. </small></p></td>
                    </tr>

                    <tr>
                      <td><code>hull.account(claims).traits(properties, context)</code></td>
                      <td><p><small>A method to Update Account Traits. If <code>claims</code> is defined, the claimed Account will be created/updated and linked to the User, else if <code>claims</code> is <code>null</code>, the Account belonging to this User will be updated. Optionally define a <code>context</code> with a <code>source</code> key to save in a custom group. </small></p></td>
                    </tr>

                    <tr>
                      <td><code>hull.account(claims).track('Event Name', properties)</code></td>
                      <td><p><small>A method to generate new Events for the Account. If <code>claims</code> is defined, the claimed Account will be created/updated and linked to the User, else if <code>claims</code> is <code>null</code>, the Account belonging to this User will be updated. Can be used at most 10 times in a single run of the processor. </small></p></td>
                    </tr>

                    <tr>
                      <td><code>isInSegment('Segment')</code></td>
                      <td><p><small>A convenience method allowing you to quickly define if the user is a member of a given segment.</small></p></td>
                    </tr>
                    <tr>
                      <td><code>moment()</code></td>
                      <td><p><small>The <a href="http://momentjs.com/" target='_blank'>Moment.js</a> library.</small></p></td>
                    </tr>
                    <tr>
                      <td><code>URI()</code></td>
                      <td><p><small>The <a href="https://medialize.github.io/URI.js/" target='_blank'>URI.js</a> library.</small></p></td>
                    </tr>
                    <tr>
                      <td><code>_</code></td>
                      <td><p><small>The <a href="https://lodash.com/" target='_blank'>lodash</a> library.</small></p></td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
            </Row>

          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.close.bind(this)}>Close</Button>
          </Modal.Footer>
        </Modal>
      </div>
    )
  }
}
