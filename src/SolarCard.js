import React from 'react';
import { Card, Button, Alert } from 'react-bootstrap';
import RateCard from './RateCard';
import qs from 'query-string';

export default class SolarCard extends React.Component 
{
  state = {
    production: "",
    status: "No data retrieved",
  }

  render() {
    let enphaseAppID = process.env.REACT_APP_ENPHASE_APP_ID;
    return (
      <div>
        <Card>
          <Card.Header>
            Solar
          </Card.Header>
          <Alert variant="info">{this.state.status}</Alert>
          <Card.Body>
            <Card.Text>
              When Solar is installed Powerwall can only charge from Solar (not grid).  In order to simulate we need to know about Solar Generation,
              currently (because it's what I use) this tool supports the Enlighten Systems monitoring API.  If you'd like it to support your use
              case <a href="https://github.com/BadPirate/pgewall/issues/new">file an issue</a>.
            </Card.Text>
            {
                enphaseAppID
                ? <EnphaseComponent enphaseAppID={enphaseAppID}/>
                : <Alert variant="danger">
                    Must set <code>REACT_APP_ENPHASE_APP_ID</code> environmental variable to Enphase Developer App ID in order to enable Enphase integration
                  </Alert>
              }
          </Card.Body>
        </Card>
        { this.state.production ? <RateCard usage={this.props.usage} solar={this.state.production}/> : null }
      </div>
    );
  }
}

class EnphaseComponent extends React.Component 
{
  render() {
    let enphaseAppID = process.env.REACT_APP_ENPHASE_APP_ID;
    let userID = qs.parse(window.location.search).user_id;
    return (
      <div>
      {
        userID
        ? <div>
            <Button>Logout Enphase Enlighten</Button>
          </div>
        : <Button href={`https://enlighten.enphaseenergy.com/app_user_auth/new?app_id=${enphaseAppID}&redirect=${window.location.href}`}>Retrieve using Enphase Enlighten</Button>
      }
      </div>
    );
  } 
}