import React, { Component } from 'react';
import {Modal, Tooltip, Button, Popover, OverlayTrigger} from 'react-bootstrap';

export default class Help extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showModal: false
    }
  }

  close() {
    this.setState({ showModal: false });
  }

  open() {
    this.setState({ showModal: true });
  }

  render(){
    let tooltip = <Tooltip id='tip'>Ship Help and Docs, Read me!</Tooltip>;
    const st = {
      position: 'absolute',
      top: -5,
      left: 0,
      zIndex: 1000
    }

    return (
      <div style={st}>
        <OverlayTrigger overlay={tooltip}>
          <Button bsStyle="default" bsSize="sm" onClick={this.open.bind(this)} > Help </Button>
        </OverlayTrigger>

        <Modal show={this.state.showModal} bsSize='large' onHide={this.close.bind(this)}>
          <Modal.Header closeButton>
            <Modal.Title>Computed Traits Help</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>This ship lets you apply transformations to users and add / edit their Traits every time they change</p>
            <p>It is very useful to compute properties on the fly, and store them natively. This way, every product you have connected to Hull will benefit from those.</p>

            <hr />

            <p>
              In the <strong>left panel</strong>, you can see a sample user, and optionally search for a specific one to view all their properties
            </p>

            <hr />

            <p>
              In the <strong>center panel</strong>, you can write Javascript code to manipulate data, and return a new object with the computed properties.
              You can't use asynchronous code, and must return an object at the end of your code.
              Here are a the variables and libraries you can access:
            </p>

            <table>
              <tbody>
                <tr>
                  <td><code>user</code></td>
                  <td>
                    <p>The User data (as seen on the left side)</p></td>
                </tr>
                <tr>
                  <td><code>segments</code></td>
                  <td>
                    <p>The User's segments (seen on the left side)</p></td>
                </tr>
                <tr>
                  <td><code>ship</code></td>
                  <td>
                    <p>The Ship's data. Can be used to store additional data</p></td>
                </tr>
                <tr>
                  <td><code>isInSegment('Segment')</code></td>
                  <td>
                    <p>A convenience method allowing you to quickly define if the user is a member of a given segment.</p></td>
                </tr>
                <tr>
                  <td><code>moment()</code></td>
                  <td>
                    <p>The <a href="http://momentjs.com/" target='_blank'>Moment.js</a> library.</p></td>
                </tr>
                <tr>
                  <td><code>URI()</code></td>
                  <td>
                    <p>The <a href="https://medialize.github.io/URI.js/" target='_blank'>URI.js</a> library.</p></td>
                </tr>
                <tr>
                  <td><code>_</code></td>
                  <td>
                    <p>The <a href="https://lodash.com/" target='_blank'>lodash</a> library.</p></td>
                </tr>
              </tbody>
            </table>

            <p>Everything you return from your code is prefixed with the <code>traits_</code> keyword and then merged with the user</p>

            <hr />

            <p>
              As you write code, you see a preview of the resulting user on the right panel.
            </p>
            <p>
              Updated fields are highlighted so you can easily see what changed.
            </p>
            <p>
              When you're satisfied, click the "Save" button.
              Changes will be applied to users automatically whenever they are udpated. We don't back-process users who don't change
            </p>

          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.close.bind(this)}>Close</Button>
          </Modal.Footer>
        </Modal>
      </div>
    )
  }
}
