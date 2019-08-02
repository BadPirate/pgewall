import React from 'react';
import { Card, Button, Alert } from 'react-bootstrap';
import RateCard from './RateCard';
import qs from 'query-string';

export default class SolarCard extends React.Component 
{
  state = {
    production: "",
    status: "No data retrieved",
    enphaseUserID: '',
    enphaseSystems: ''
  }

  render() {
    let enphaseAppID = process.env.REACT_APP_ENPHASE_APP_ID;
    
    if (this.state.enphaseUserID) 
    {
      if (!this.state.enphaseSystems) {
         // TODO: Load Systems from API
      }
    }
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
              ? <EnphaseComponent enphaseAppID={enphaseAppID} enphaseUserID={this.state.enphaseUserID} logout={_ => { this.logoutEnphase(); }}/>
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

  componentDidMount() {
    let parseID = qs.parse(window.location.search).user_id;
    if (!this.state.enphaseUserID) {
      if(parseID) {
        localStorage.setItem('enphaseUserID',parseID);
        window.location = window.location.protocol + '//' + window.location.host + window.location.pathname;
      }
      let storedID = localStorage.getItem('enphaseUserID');
      if (storedID) {
        this.setState({
          enphaseUserID: storedID,
          status: "Authenticated Enphase Enlighten.",
        });
      }
    }
  }

  logoutEnphase() {
    localStorage.setItem('enphaseUserID','');
    this.setState({
      enphaseUserID: '',
      status: 'Logged out Enphase'
    });
  }
}

class EnphaseComponent extends React.Component 
{
  render() {
    let enphaseAppID = process.env.REACT_APP_ENPHASE_APP_ID;
    return (
      <div>
      {
        this.props.enphaseUserID
        ? <div>
            <Button onClick={this.props.logout}>
              Logout Enphase Enlighten
            </Button>
          </div>
        : <Button href={`https://enlighten.enphaseenergy.com/app_user_auth/new?app_id=${enphaseAppID}&redirect=${window.location.href}`}>Retrieve using Enphase Enlighten</Button>
      }
      </div>
    );
  }
}