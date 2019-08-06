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
    let { calc, results } = this.results();
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
              place of grid during peak or shoulder time periods.  For battery efficiency, I am charging at 100%, but discharging at
              whatever the effective rate is (so grid charging will be > grid discharging based on storage loss)
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
                  <th>Period ({calc.days} days)</th>
                  <th>Charged Battery</th>
                  <th>Discharged Battery</th>
                  <th>Grid Use</th>
                  <th>Cost</th>
                  <th>Savings</th>
                </tr>
              </thead>
              <tbody>
                {
                  results.map(row => {
                    return (
                      <tr key={row.period}>
                        <td>{row.period}</td>
                        <td>{row.charged.toFixed(2)} kWH</td>
                        <td>{row.discharged.toFixed(2)} kWH</td>
                        <td>{row.grid.toFixed(2)} kWH</td>
                        <td>${row.cost.toFixed(2)}</td>
                        <td>${row.savings.toFixed(2)}</td>
                      </tr>
                    );
                  })
                }
              </tbody>
            </Table>
          </Card.Body>
        </Card>
        { 
          calc.days >= 365 
          ? <RoiCard results={this.results.bind(this)}  batteries={this.state.batteries} 
             storage={this.state.storagePer} /> 
          : <Alert variant="info">
            Upload 1 year of data to make an ROI estimate ({calc.days} uploaded)
          </Alert>
        }
      </div>
    );
  }

  results(
    batteryDecay = 0,
    rate = 1,
  ) 
  {
    let calc = this.calculateSavings(this.state.storagePer*(1-batteryDecay));
    let pr = this.props.peakRate;
    let or = this.props.offRate;
    let sr = this.props.shoulderRate;
    let results = [
      {
        period: "Peak",
        charged: calc.pb < 0 ? -calc.pb : 0,
        discharged: calc.pb > 0 ? calc.pb : 0,
        grid: calc.pg,
        cost: calc.pg * pr * rate,
        savings: calc.pb * pr * rate,
      },
      {
        period: "Off Peak",
        charged: calc.ob < 0 ? -calc.ob : 0,
        discharged: calc.ob > 0 ? calc.ob : 0,
        grid: calc.og,
        cost: calc.og * or * rate,
        savings: calc.ob * or * rate,
      },
      {
        period: "Shoulder",
        charged: calc.sb < 0 ? -calc.sb : 0,
        discharged: calc.sb > 0 ? calc.sb : 0,
        grid: calc.sg,
        cost: calc.sg * sr * rate,
        savings: calc.sb * sr * rate,
      }
    ];
    let tca = 0;
    let td = 0;
    let tg = 0;
    let tco = 0;
    let ts = 0;
    results.forEach(row => {
      tca += row.charged;
      td += row.discharged;
      tg += row.grid;
      tco += row.cost;
      ts += row.savings;
    });
    results.push({
      period: "Total",
      charged: tca,
      discharged: td,
      grid: tg,
      cost: tco,
      savings: ts,
    });
    return { calc, results };
  }

  calculateSavings(
    storagePer
  ) {
    let ps = this.props.peakStart;
    let pe = this.props.peakEnd;
    let os = this.props.offStart;
    let oe = this.props.offEnd;
    let production = this.props.production;
    let batteries = parseInt(this.state.batteries);
    let storage = batteries*parseFloat(storagePer);
    let efficiency = parseFloat(this.state.efficiency);
    let charge = 0;

    // u = use, b = battery, g = grid
    let su = 0;
    let sb = 0;
    let sg = 0;

    let pu = 0;
    let pb = 0;
    let pg = 0;

    let ou = 0;
    let ob = 0;
    let og = 0;

    let days = new Set();
    let waste = 1/efficiency;
    this.props.usage.forEach((value, key) => {
      if (production && !production.has(key)) return;
      let p = (production && production.get(key)) ? production.get(key) : 0;
      let parts = key.split(',');
      let date = parts[0];

      if (!days.has(date)) {
        // It's a new day
        if (days.size >= 365) {
          return;
        }
        days.add(date);

        // If we aren't solar, we can charge during off-peak
        if (!production && charge !== storage) {
          let canStore = storage-charge;
          og += canStore;
          ob -= canStore;
          charge += canStore;
          ou += canStore;
        }
      }
      
      parts = parts[1].split(':');
      let time = parseInt(parts[0]);
      let use = value + p;
      let available = use > 0 ? Math.min(use,(charge*efficiency)) : 0;

      if (time >= ps && time < pe) {
        // Peak
        charge -= available*waste;
        pb += available;
        pg += use-available;
        pu += use + p;
      } else if (   (os > pe && time >= os && time < 24)
                 || (time < oe) ) 
      {
        // Off-Peak
        let canStore = storage-charge;
        let store = Math.min(canStore,p);
        charge += store;
        ob -= store;
        og += use+store;
        ou += use + p;
      } else {
        // Shoulder
        if (production) {
          let canStore = storage-charge;
          let store = Math.min(canStore,p);
          charge += store;
          sb -= store;
          sg += use+store;
          su += use + p;
        } else {
          charge -= available;
          sb += available;
          sg += use-available;
          su += use;
        }
      }
    });
    return {
      days: days.size,
      og: og,
      ob: ob,
      ou: ou,
      pg: pg,
      pb: pb,
      pu: pu,
      sg: sg,
      sb: sb,
      su: su,
    };
  }
}