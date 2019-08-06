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
                    {production ? 'Offpeak (Battery / Grid / Total)' : 'Off-peak charging'}
                  </th>
                  <th>
                    {production ? 'Peak (Battery / Grid / Total)' : 'Arbitraged to peak'}
                  </th>
                  <th>
                    {production ? 'Shoulder (Battery / Grid / Total)' : 'Arbitraged to shoulder'}
                  </th>
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
                    <td>{`${calc.ob.toFixed(1)} / ${calc.og.toFixed(1)} / ${calc.ou.toFixed(1)}`} kWH</td>
                    <td>{`${calc.pb.toFixed(1)} / ${calc.pg.toFixed(1)} / ${calc.pu.toFixed(1)}`} kWH</td>
                    <td>{`${calc.sb.toFixed(1)} / ${calc.sg.toFixed(1)} / ${calc.su.toFixed(1)}`} kWH</td>
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

      if (!days.has(date)) {
        // It's a new day
        if (clip && days.size >= clip) {
          return;
        }
        days.add(date);

        // If we aren't solar, we can charge during off-peak
        if (!production && charge !== storage) {
          let canStore = (storage-charge) * (1 / efficiency);
          og += canStore;
          ob -= (storage-charge);
          ou += canStore;
        }
      }
      
      parts = parts[1].split(':');
      let time = parseInt(parts[0]);
      let use = value + p;
      let available = use > 0 ? Math.min(use,charge) : 0;

      if (time >= ps && time < pe) {
        // Peak
        charge -= available;
        pb += available;
        pg += use-available;
        pu += use;
      } else if (   (os > pe && time >= os && time < 24)
                 || (time < oe) ) 
      {
        // Off-Peak
        let canStore = (storage-charge) * (1 / efficiency);
        let store = Math.min(canStore,p);
        ob += store * efficiency;
        og += use-(p-store);
        ou += p;
      } else {
        // Shoulder
        if (production) {
          let canStore = (storage-charge) * (1 / efficiency);
          let store = Math.min(canStore,p);
          sb += store * efficiency;
          sg += use-(p-store);
          su += p;
        } else {
          charge -= available;
          sb += available;
          sg += use-available;
          su += use;
        }
      }
    });
    let saved = (pb * (pr - or)) + (sb * (sr - or));
    let spent = ((pg) * pr) + ((sg) * sr) + (og * or);
    return {
      saved: saved,
      spent: spent,
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