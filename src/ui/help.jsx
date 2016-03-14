import React, { Component } from 'react';
import { Modal, Tooltip, Button, Popover, OverlayTrigger, Row, Col, Table} from 'react-bootstrap';
import Icon from './icon';

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
    let tooltip = <Tooltip className="in" placement="left" id='tip'>Ship Help and Docs, Read me!</Tooltip>;

    return (
      <div>
        <OverlayTrigger overlay={tooltip}>
          <Button bsStyle="default" bsSize="sm" clasName='btn-pill btn-rounded' onClick={this.open.bind(this)} > Help </Button>
        </OverlayTrigger>

        <Modal show={this.state.showModal} bsSize='large' onHide={this.close.bind(this)}>
          <Modal.Header closeButton>
            <Modal.Title>Computed Traits Ship</Modal.Title>
          </Modal.Header>
          <Modal.Body>

            <Row>
              <Col xs={3} sm={2}>
                <Icon name='calculator' responsive/> 
              </Col>
              <Col xs={9} sm={10}>
                <p>This ship lets you apply transformations to users and add / edit their Traits every time they change</p>
                <p>Use it to compute and store properties from other customer properties. Every Ship you add to Hull will receive this computed data.</p>
              </Col>
            </Row>

            <hr/>

            <Row>
              <Col md={6}>
                <Row>
                  <Col sm={4}>
                    <Icon name='rocker' responsive/> 
                  </Col>
                  <Col sm={8}>
                    <p>
                      In the <strong>left panel</strong>, you can see a sample user with all his/her properties. You can search for a specific user
                    </p>
                    <p>As you write code, you see a preview of the resulting user on the right panel. Updated fields are highlighted so you can easily see what changed. </p>
                  </Col>
                </Row>
              </Col>
              <Col md={6}>
                <Row>
                  <Col sm={4}>
                    <Icon name='punker' responsive/> 
                  </Col>
                  <Col sm={8}>
                    <p>In the <strong>right panel</strong>, you see a realtime preview of the updated user.</p>
                    <p>Everything you return from your code is prefixed with <code>traits_</code> and then merged</p>
                    <p>
                      When you're satisfied, click <strong>Save</strong>
                      Changes will be applied automatically whenever users are udpated. We don't back-process users who don't change.
                    </p>
                  </Col>
                </Row>
              </Col>
            </Row>

            <hr/>

            <Row>
              <Col xs={3} sm={2}>
                <Icon name='compute' responsive/> 
              </Col>
              <Col xs={9} sm={10}>
                <p>
                  On the <strong>Sidebar</strong>, you can write Javascript code to manipulate data, and return a new object with the computed properties.
                  You can't use asynchronous code, and must return an object at the end of your code.
                  Here are a the variables and libraries you can access:
                </p>
              </Col>
            </Row>

            <Table striped bordered condensed hover className='mt-1'>
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
            </Table>

          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.close.bind(this)}>Close</Button>
          </Modal.Footer>
        </Modal>
      </div>
    )
  }
}
