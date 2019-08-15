import React from 'react';
import { Card, InputGroup, FormControl, Table } from 'react-bootstrap';
import RoiCard from './RoiCard';
import { dayOfYear } from './utils';

/**
 * @typedef {Object} CalculatedSavings
 * @property {number} days number of days tracked
 * @property {number} og Off-Peak Grid Use
 * @property {number} ob Off-Peak Battery Use
 * @property {number} ou Off-Peak Total Use
 * @property {number} pg Peak Grid
 * @property {number} pb Peak Battery
 * @property {number} pu Peak Total
 * @property {number} sg Shoulder Grid
 * @property {number} sb Shoulder Battery
 * @property {number} su Shoulder Use
 */

  /**
  * @typedef {Object} CalculatedResult
  * @property {string} period name for the relevant period
  * @property {number} charged kWh battery charged during period
  * @property {number} discharged kWh battery discharged during period
  * @property {number} grid kWh pulled from grid during period
  * @property {number} cost cost ($) for electric pulled from grid during period
  * @property {number} savings savings provided by battery discharge
  * @property {number} solarSavings savings provided by solar panels
  */

/**
 * @typedef {Object} SimulationResults
 * @property {CalculatedSavings} calc
 * @property {[CalculatedResult]} results
 */

export default class PowerwallCard extends React.Component
{
  state = {
    batteries: 1,
    storagePer: 13.5,
    efficiency: 0.9,
  }

  render() {
    let simulated = this.props.simulated;
    let sr = this.results(0,1,(simulated));
    let days = sr.calc.days;
    let results = sr.results;
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
              {
                (parseInt(this.state.batteries) !== 0) ?
                [
                  <InputGroup.Text>
                    Usable Storage per Battery (kWH)
                  </InputGroup.Text>,
                  <FormControl type="input" value={this.state.storagePer} onChange={ e => { this.setState({ storagePer: e.target.value })}}/>,
                  <InputGroup.Text>
                    Round Trip Efficiency
                  </InputGroup.Text>,
                  <FormControl type="input" value={this.state.efficiency} onChange={ e => { this.setState({ efficiency: e.target.value })}}/>
                ] : null
              }
            </InputGroup>
            {
              (parseInt(this.state.batteries) !== 0) ?
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Period ({days} days)</th>
                    <th>Charged Battery</th>
                    <th>Discharged Battery</th>
                    <th>Grid Use</th>
                    <th>Cost</th>
                    <th>Powerwall Only Savings</th>
                    { simulated ? <th>Powerwall + Solar Savings</th> : null }
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
                          {simulated ? <td>${row.solarSavings.toFixed(2)}</td> : null}
                        </tr>
                      );
                    })
                  }
                </tbody>
              </Table> : null
            }
          </Card.Body>
        </Card>
        <RoiCard results={this.results.bind(this)}  batteries={this.state.batteries} storage={this.state.storagePer} simulated={simulated} /> 
      </div>
    );
  }

  /**
   * @param {number=0} batteryDecay percentage of battery decay to simulate
   * @param {number=1} rate electricity rate multiplier
   * @param {boolean} simulated use solar simulation data
   * @returns {SimulationResults} results
   */
  results(
    batteryDecay = 0,
    rate = 1,
    simulated = false,
  ) 
  {
    let calc = this.calculateSavings(this.state.storagePer*(1-batteryDecay),simulated ? this.props.simulated : null);
    let ogCalc = simulated ? this.calculateSavings(this.state.storagePer*(1-batteryDecay),false) : null;
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
        solarSavings: ogCalc ? (ogCalc.pg - calc.pg) * pr * rate : 0,
      },
      {
        period: "Off Peak",
        charged: calc.ob < 0 ? -calc.ob : 0,
        discharged: calc.ob > 0 ? calc.ob : 0,
        grid: calc.og,
        cost: calc.og * or * rate,
        savings: calc.ob * or * rate,
        solarSavings: ogCalc ? (ogCalc.og - calc.og) * or * rate : 0,
      },
      {
        period: "Shoulder",
        charged: calc.sb < 0 ? -calc.sb : 0,
        discharged: calc.sb > 0 ? calc.sb : 0,
        grid: calc.sg,
        cost: calc.sg * sr * rate,
        savings: calc.sb * sr * rate,
        solarSavings: ogCalc ? (ogCalc.sg - calc.sg) * sr * rate : 0,
      }
    ];
    let tca = 0;
    let td = 0;
    let tg = 0;
    let tco = 0;
    let ts = 0;
    let tss = 0;
    results.forEach(row => {
      tca += row.charged;
      td += row.discharged;
      tg += row.grid;
      tco += row.cost;
      ts += row.savings;
      tss += row.solarSavings;
    });
    results.push({
      period: "Total",
      charged: tca,
      discharged: td,
      grid: tg,
      cost: tco,
      savings: ts,
      solarSavings: tss,
    });
    return { calc, results };
  }

   /**
    * @param {number} storagePer kWh Storage Per Battery
    * @param {any=null} simulated simulated solar production data
    * @returns {CalculatedSavings}
    */
  calculateSavings(
    storagePer,
    simulated=null
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
    this.props.usage.forEach((value, key) => {
      if (production && !production.has(key)) return;
      let p = (production && production.get(key)) ? production.get(key) : 0;
      let parts = key.split(',');
      let date = parts[0];
      let time = parts[1].split(':')[0];
      let s = 0;
      if (simulated)
      {
        let doy = dayOfYear(date);
        s = simulated.get(`${doy}-${parseInt(time)}`);
      }

      if (!days.has(date)) {
        // It's a new day
        if (days.size >= 365) {
          return;
        }
        days.add(date);

        // If we aren't solar, we can charge during off-peak
        if (!production && !simulated && charge !== storage) {
          let canStore = storage-charge;
          og += canStore;
          ob -= canStore;
          charge += canStore;
          ou += canStore;
        }
      }

      let period = "shoulder";
      if (time >= ps && time < pe) period = "peak";
      if ((os > pe && time >= os && time < 24) || (time < oe) ) period = "offpeak";

      let charging = (production || simulated) && (period === 'shoulder' || period === 'offpeak');

      let g = 0;
      let b = 0;
      let u = value+p;

      if (charging)
      {
        // Grid is our use
        g = u;

        let storableProduction = Math.min(p, (storage-charge)/efficiency);
        if (storableProduction)
        {
          // This actual production would have been used to charge Powerwall
          let xfered = storableProduction*efficiency
          b -= xfered;
          charge += xfered;
          p -= storableProduction;
        }

        let storableSim = Math.min(s, (storage-charge)/efficiency);
        if (storableSim)
        {
          // This sim production would have been used to charge Powerwall
          let xfered = storableSim*efficiency
          b -= xfered;
          charge += xfered;
          s -= storableSim;
        }

        // Any leftover production reduces grid use
        g-=p+s;
      } else {
        // Grid starts with our usage
        g = u;

        let usableCharge = Math.min(charge, u);
        if (usableCharge > 0)
        {
          // Discharging from battery first
          b += usableCharge;
          g -= usableCharge;
          charge -= usableCharge;
        }

        // Any production goes to grid
        g-=p+s;
      }

      switch(period)
      {
        case 'peak':
          pg += g;
          pb += b;
          pu += u;
          break;
        case 'offpeak':
          og += g;
          ob += b;
          ou += u;
          break;
        default:
          sg += g;
          sb += b;
          su += u;
          break;
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