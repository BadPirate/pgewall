import React from 'react';
import { Card, InputGroup, FormControl, Table, Alert } from 'react-bootstrap';
import RoiCard from './RoiCard';

export default class PowerwallCard extends React.Component
{
  state = {
    batteries: 1,
    storagePer: 13.5,
    efficiency: 0.9,
  }

  render() {
    let calc = this.calculateSavings(this.state.storagePer);
    let production = this.props.production;
    return (
      <div>
        <Card>
          <Card.Header>
            Powerwall Information
          </Card.Header>
          <Card.Body>
            <Card.Text>
              Now provide information about the powerwall(s) you are considering.  I've prefilled with the numbers I have
              for the Powerwall 2.  For the date below, Arbitraged is the amount of electricity that would
              have been pulled off grid and stored during off peak, and then used in
              place of grid during peak or shoulder time periods.
            </Card.Text>
            <InputGroup>
              <InputGroup.Prepend>
                <InputGroup.Text>         
                  Number of Batteries
                </InputGroup.Text>
              </InputGroup.Prepend>
              <FormControl type="input" value={this.state.batteries} onChange={ e => { this.setState({ batteries: e.target.value })}}/>
              <InputGroup.Text>
                Usable Storage per Battery (kWH)
              </InputGroup.Text>
              <FormControl type="input" value={this.state.storagePer} onChange={ e => { this.setState({ storagePer: e.target.value })}}/>
              <InputGroup.Text>
                Round Trip Efficiency
              </InputGroup.Text>
              <FormControl type="input" value={this.state.efficiency} onChange={ e => { this.setState({ efficiency: e.target.value })}}/>
            </InputGroup>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>
                    {production ? 'Solar' : 'Off-peak'} charging
                  </th>
                  <th>
                    Arbitraged to peak
                  </th>
                  <th>
                    Arbitraged to shoulder
                  </th>
                  <th>Max used</th>
                  <th>
                    Savings
                  </th>
                  <th>
                    Bill ({calc.days} days)
                  </th>
                </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{calc.oa.toFixed(1)} kWH</td>
                    <td>{calc.pa.toFixed(1)} / {calc.pu.toFixed(1)} kWH</td>
                    <td>{calc.sa.toFixed(1)} / {calc.su.toFixed(1)} kWH</td>
                    <td>{calc.mu.toFixed(1)} kWH</td>
                    <td>${calc.saved.toFixed(2)}</td>
                    <td>${calc.spent.toFixed(2)}</td>
                  </tr>
                </tbody>
            </Table>
          </Card.Body>
        </Card>
        { 
          calc.days >= 365 
          ? <RoiCard calc={this.calculateSavings.bind(this)}  batteries={this.state.batteries} 
             storage={this.state.storagePer} /> 
          : <Alert variant="info">
            Upload 1 year of data to make an ROI estimate ({calc.days} uploaded)
          </Alert>
        }
      </div>
    );
  }

  calculateSavings(
    storagePer,
    rateMultiplier = 1,
    clip = ''
  ) {
    let ps = this.props.peakStart;
    let pe = this.props.peakEnd;
    let pr = this.props.peakRate * rateMultiplier;
    let os = this.props.offStart;
    let oe = this.props.offEnd;
    let or = this.props.offRate * rateMultiplier;
    let sr = this.props.shoulderRate * rateMultiplier;
    let production = this.props.production;
    let lastDate = '';
    let days = 1;
    let batteries = parseInt(this.state.batteries);
    let storage = batteries*parseFloat(storagePer);
    let efficiency = parseFloat(this.state.efficiency);
    let charge = 0;
    let oa = 0;
    let su = 0;
    let sa = 0;
    let pu = 0;
    let pa = 0;
    let mu = 0;
    let du = 0;
    let ou = 0;
    this.props.usage.forEach((value, key) => {
      if (production && !production.has(key)) return;
      let p = (production && production.get(key)) ? production.get(key) : 0;
      if (clip && days >= clip) {
        return;
      }
      let parts = key.split(',');
      let date = parts[0];
      if (lastDate !== date) {
        days++;
        lastDate = date;
        if (du > mu) {
          mu = du;
        }
        du = 0;
        if (!production && charge !== storage) {
          let drain = (storage-charge) * (1 / efficiency);
          oa += drain;
          ou += drain;
          charge += drain;
        }
      }
      parts = parts[1].split(':');
      let time = parseInt(parts[0]);
      let a = charge > value ? value : charge;
      if (value < 0) a = 0;
      if (time >= ps && time < pe) {
        // Peak
        if (a > 0) 
        {
          pa += a;
          charge -= a;
        }
        pu += value;
        du += value;
      } else if (   (os > pe && time >= os && time < 24)
                 || (time < oe) ) 
      {
        // Off-Peak
        if (p)
        {
          // Solar setup, we drain from grid for house when able, and charge battery
          let store = Math.min(p,storage-charge);
          ou += store; // Use from grid instead
          charge += store * efficiency; // Store into battery
        }
        ou += value;
      } else {
        // Shoulder
        if (!production && a > 0)
        {
          sa += a;
          charge -= a;
        }
        if (p)
        {
          // Solar setup, we drain from grid for house when able, and charge battery
          let store = Math.min(p,storage-charge);
          su += store; // Use from grid instead
          charge += store * efficiency; // Store into battery
        }
        su += value;
        du += value;
      }
    });
    let saved = (pa * (pr - or)) + (sa * (sr - or));
    let spent = ((pu-pa) * pr) + ((su-sa) * sr) + (ou * or);
    return {
      saved: saved,
      spent: spent,
      days: days,
      oa: oa,
      sa: sa,
      su: su,
      pa: pa,
      pu: pu,
      mu: mu
    };
  }
}