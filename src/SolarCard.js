import React from 'react';
import { Card, Button, Alert, DropdownButton, Dropdown, InputGroup } from 'react-bootstrap';
import RateCard from './RateCard';
import qs from 'query-string';
import { EnphaseAPI } from './Api';
const { Map } = require('immutable');

export default class SolarCard extends React.Component 
{
  state = {
    production: '',
    status: "No data retrieved",
    enphaseUserID: '',
    enphaseSystems: '',
    selected: '',
    error: '',
  }

  render() {
    let enphaseAppID = process.env.REACT_APP_ENPHASE_APP_ID;
    let enphaseUserID = this.state.enphaseUserID;
    if (enphaseUserID && !this.state.error) 
    {
      let api = new EnphaseAPI(enphaseUserID);
      if (!this.state.enphaseSystems && !this.state.error) {
        api.getSystems()
        .then(systems => { 
          if (systems.length > 0) {
            this.setState({
              enphaseSystems: systems,
              status: "Systems loaded",
              selected: 0,
            })
          } else {
            throw new Error("No systems available");
          }
        })
        .catch(error => {
          console.log(error)
          this.setState({
            error: error.message,
            status: "Enlighten error",
          })
        })
      }
    }
    return (
      <div>
        <Card>
          <Card.Header>
            Solar
          </Card.Header>
          { this.state.error ? <Alert variant="danger">{this.state.error}</Alert> : null }
          <Alert variant="info">{this.state.status}</Alert>
          <Card.Body>
            <Card.Text>
              When Solar is installed Powerwall can only charge from Solar (not grid).  In order to simulate we need to know about Solar Generation,
              currently (because it's what I use) this tool supports the Enlighten Systems monitoring API.  If you'd like it to support your use
              case <a href="https://github.com/BadPirate/pgewall/issues/new">file an issue</a>.
            </Card.Text>
            {
              enphaseAppID
              ? <EnphaseComponent enphaseAppID={enphaseAppID} enphaseUserID={this.state.enphaseUserID} enphaseSystems={this.state.enphaseSystems}
                 selected={this.state.selected} select={ systemID => { this.selectSystem(systemID); }} usage={this.props.usage} logout={_ => { this.logoutEnphase(); }}
                 production={this.state.production} setProduction={ (key, power) => { this.setProduction(key, power); }}/>
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
    if (!this.state.production) {
      let cached = localStorage.getItem('production');
      if (cached) {
        this.setState({
          production: new Map(JSON.parse(cached))
        });
      }
    }
  }

  selectSystem(systemID) {
    this.setState({
      selected: systemID
    });
  }

  setProduction(key, power) {
    this.setState(state => {
      let map = state.production || new Map();
      map = map.set(key,power);
      let percentage = map.size / this.props.usage.size;
      localStorage.setItem("production",JSON.stringify([...map]));
      console.log(map.size,this.props.usage.size);
      return {
        production: map,
        status: `Retrieving production ${percentage.toFixed(3)}%...`,
      };
    })
  }

  logoutEnphase() {
    localStorage.setItem('enphaseUserID','');
    localStorage.setItem('production','');
    this.setState({
      enphaseUserID: '',
      status: 'Logged out Enphase',
      enphaseSystems: '',
      selected: '',
      error: '',
      production: '',
    });
  }
}

class EnphaseComponent extends React.Component 
{
  state = {
    retrieving: false,
  }

  render() {
    let enphaseAppID = process.env.REACT_APP_ENPHASE_APP_ID;
    let systems = this.props.enphaseSystems;
    let system = systems ? this.props.enphaseSystems[this.props.selected || 0] : '';
    var sysCount = 0;
    if (this.state.retrieving) {
      // Retrieve a package
      let missing = false;
      this.props.usage.forEach((value, key) => {
        if (missing) return;
        if (!this.props.production || !this.props.production.has(key))
        {
          missing = true;
          let parts = key.split(',');
          let date = parts[0];
          let time = parts[1];
          parts = date.split('-');
          let y = parts[0];
          let m = parts[1];
          let d = parts[2];
          parts = time.split(':');
          let h = parts[0];
          let start = (new Date(y,m,d,h).getTime())/1000;
          let end = start + 3600;
          let api = new EnphaseAPI(this.props.enphaseUserID);
          api.getProduction(system.system_id,start,end)
          .then(power => {
            console.log('Power result',key,'=',power);
            this.props.setProduction(key,parseInt(power));
          }, error => {
            console.log('Power Error',key,error);
            this.props.setProduction(key,0)
          })
          console.log(y,m,d,h,start);
        }
      })
    }
    return (
      <div>
      {
        this.props.enphaseUserID
        ? <div>
            <Button onClick={_ => { this.setState({retrieving: false}); this.props.logout() }}>
              Logout Enphase Enlighten
            </Button>
          </div>
        : <Button href={`https://enlighten.enphaseenergy.com/app_user_auth/new?app_id=${enphaseAppID}&redirect=${window.location.href}`}>Retrieve using Enphase Enlighten</Button>
      }
      {
        system
        ? <div>
            <hr/>
            <InputGroup>
              <InputGroup.Prepend>
                <DropdownButton variant="secondary" title={system.system_name}>
                  {
                    systems.map(s => {
                      let sys = sysCount;
                      sysCount++;
                      return (
                        <Dropdown.Item key={sys} onClick={_ => {
                          this.props.select(sys);
                        }}>
                          {s.system_name}
                        </Dropdown.Item>
                      );
                    })
                  }
                </DropdownButton>
              </InputGroup.Prepend>
              <InputGroup.Text>
                Select System
              </InputGroup.Text>
              <InputGroup.Append>
                {
                  this.state.retrieving
                  ? <Button variant="warning" onClick={_ => {this.setState({retrieving: false})}}>Stop Retrieving</Button>
                  : <Button variant="primary" onClick={_ => { this.setState({retrieving: true})}}>
                      Retrieve Solar Production
                    </Button>
                }
              </InputGroup.Append>
            </InputGroup>
          </div>
        : null
      }
      </div>
    );
  }
}