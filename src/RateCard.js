import React from 'react';
import { Card, Table, InputGroup, FormControl } from 'react-bootstrap';
import PowerwallCard from './PowerwallCard';

export default class RateCard extends React.Component 
{
  state = {
    peakStart: '14:00',
    peakEnd: '21:00',
    peakRate: '.51832',
    offStart: '23:00',
    offEnd: '07:00',
    offRate: '.13452',
    shoulderRate: '.28096',
  }

  update(name, value)
  {
    let map = new Map([[name, value]]);
    this.setState(map);
  }

  dayOfYear(date)
  {
    var start = new Date(date.getFullYear(), 0, 0);
    var diff = (date - start) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
    var oneDay = 1000 * 60 * 60 * 24;
    var day = Math.floor(diff / oneDay);
    return day;
  }

  render() {
    let simulated = this.props.simulated;
    let periods = new Map(
      [[ 'peak', 0 ],
      [ 'offpeak', 0 ],
      [ 'shoulder', 0 ]]
    );
    let simPeriods = simulated ? new Map(
      [[ 'peak', 0 ],
      [ 'offpeak', 0 ],
      [ 'shoulder', 0 ]]
    ) : null;
    let tp = this.props.production ? new Map(
      [[ 'peak', 0 ],
      [ 'offpeak', 0 ],
      [ 'shoulder', 0 ]]
    ) : null;
    let ts = simulated ? new Map(
      [[ 'peak', 0 ],
      [ 'offpeak', 0 ],
      [ 'shoulder', 0 ]]
    ) : null;
    let ps = parseInt(this.state.peakStart.split(':')[0]);
    let pe = parseInt(this.state.peakEnd.split(':')[0]);
    let os = parseInt(this.state.offStart.split(':')[0]);
    let oe = parseInt(this.state.offEnd.split(':')[0]);
    let pr = parseFloat(this.state.peakRate);
    let or = parseFloat(this.state.offRate);
    let sr = parseFloat(this.state.shoulderRate);
    let production = this.props.production;
    let totalCost = 0;
    let totalSimCost = 0;
    let totalGrid = 0;
    let totalSolar = 0;
    let totalSimulated = 0;
    let totalSimGrid = 0;
    let firstDate = '';
    let lastDate = '';
    this.props.usage.forEach((value, key) => {
      if(this.props.production && !this.props.production.has(key)) return;
      let p = (this.props.production && this.props.production.has(key)) ? this.props.production.get(key) : 0;
      totalSolar += p;
      totalGrid += value;
      let date = key.split(',')[0];
      if (!firstDate || date < firstDate) {
        firstDate = date;
      }
      if (!lastDate || date > lastDate) {
        lastDate = date;
      }
      let parts = key.split(',')[1].split(':');
      let time = parseInt(parts[0]);
      let s = 0;
      if(simulated) {
        let doy = this.dayOfYear(new Date(date));
        s = simulated.get(`${doy}-${parseInt(time)}`);
        totalSimulated += s;
        totalSimGrid += value - s;
      }
      if (time >= ps && time < pe) {
        periods.set('peak',periods.get('peak') + value);
        if (ts) simPeriods.set('peak',simPeriods.get('peak') + (value - s));
        if (tp) tp.set('peak',tp.get('peak') + p);
        if (ts) ts.set('peak',ts.get('peak') + s);
        totalCost += value * pr;
        totalSimCost += (value - s) * pr;
      } else if (   (os > pe && time >= os && time < 24)
                 || (time < oe) ) 
      {
        periods.set('offpeak',periods.get('offpeak') + value);
        if (ts) simPeriods.set('offpeak',simPeriods.get('offpeak') + (value - s));
        if (tp) tp.set('offpeak',tp.get('offpeak') + p);
        if (ts) ts.set('offpeak',ts.get('offpeak') + s);
        totalCost += value * or;
        totalSimCost += (value - s) * or;
      } else {
        periods.set('shoulder',periods.get('shoulder') + value);
        if (ts) simPeriods.set('shoulder',simPeriods.get('shoulder') + (value - s));
        if (tp) tp.set('shoulder',tp.get('shoulder') + p);
        if (ts) ts.set('shoulder',ts.get('shoulder') + s);
        totalCost += value * sr;
        totalSimCost += (value - s) * sr;
      }
    });
    return (
      <div>
        <Card>
          <Card.Header>
            Update Rate Periods
          </Card.Header>
          <Card.Body>
            <Card.Text>
              Now you'll need to lookup the hours of your various rate periods and their rates, 
              and adjust these fields below as needed.  I've filled out 2019 rate for the EV-A plan.
              Note, that some Time of Use plans have different rates during winter and summer months,
              currently this is not supported, because the arbitrage is less valuable in those cases
              so likely it's a worse plan for this strategy in general.  This will return total usage and
              potential savings for the period you uploaded.
            </Card.Text>
            <InputGroup>
              <InputGroup.Prepend>
                <InputGroup.Text>
                  Peak
                </InputGroup.Text>
              </InputGroup.Prepend>
              <InputGroup.Text>
                From
              </InputGroup.Text>
              <FormControl as="input" onChange={ e => { this.setState({ peakStart: e.target.value })}} value={this.state.peakStart}/>
              <InputGroup.Text>
                To
              </InputGroup.Text>
              <FormControl as="input" onChange={ e => { this.setState({ peakEnd: e.target.value })}} value={this.state.peakEnd}/>
              <InputGroup.Text>
                Rate
              </InputGroup.Text>
              <FormControl as="input" onChange={ e => { this.setState({ peakRate: e.target.value })}} value={this.state.peakRate}/>
            </InputGroup>
            <InputGroup>
              <InputGroup.Prepend>
                <InputGroup.Text>
                  Off-Peak
                </InputGroup.Text>
              </InputGroup.Prepend>
              <InputGroup.Text>
                From
              </InputGroup.Text>
              <FormControl as="input" onChange={ e => { this.setState({ offStart: e.target.value })}} value={this.state.offStart}/>
              <InputGroup.Text>
                To
              </InputGroup.Text>
              <FormControl as="input" onChange={ e => { this.setState({ offEnd: e.target.value })}} value={this.state.offEnd}/>
              <InputGroup.Text>
                Rate
              </InputGroup.Text>
              <FormControl as="input" onChange={ e => { this.setState({ offRate: e.target.value })}} value={this.state.offRate}/>
            </InputGroup>
            <InputGroup>
              <InputGroup.Prepend>
                <InputGroup.Text>
                  Shoulder
                </InputGroup.Text>
              </InputGroup.Prepend>
              <InputGroup.Text>
                Rate
              </InputGroup.Text>
              <FormControl as="input" onChange={ e => { this.setState({ shoulderRate: e.target.value })}} value={this.state.shoulderRate}/>
            </InputGroup>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Period {firstDate} to {lastDate}</th>
                  { production ? <th>Solar Production</th> : null }
                  { simulated ? <th>Simulated Solar</th> : null }
                  <th>Grid Use</th>
                  { simulated ? <th>Simulated Grid</th> : null }
                  { production ? <th>Total Use</th> : null }
                  <th>Cost</th>
                  { simulated ? [<th>Simulated Cost</th>,<th>Simulated Savings</th>] : null}
                </tr>
              </thead>
              <tbody>
                {
                  Array.from(periods, ([key, value]) => {
                    let p = production ? tp.get(key) : 0;
                    let s = simulated ? ts.get(key) : 0;
                    var r = sr;
                    if (key === 'peak') {
                      r = pr;
                    } else if (key === 'offpeak') {
                      r = or;
                    }                
                    let cost = (value * r).toFixed(2);
                    let simValue = simulated ? simPeriods.get(key) : 0;
                    let simCost = simulated ? (simValue * r).toFixed(2) : 0;
                    return (
                      <tr key={key}>
                        <td>{key}</td>
                        { production ? <td>{p.toFixed(2)} kWH</td> : null }
                        { simulated ? <td>{s.toFixed(2)} kWH</td> : null}
                        <td>{value.toFixed(2)} kWH</td>
                        { simulated ? <td>{simValue.toFixed(2)} kWH</td> : null }
                        { production ? <td>{(value+p).toFixed(2)} kWH</td> : null }
                        <td>${cost}</td>
                        { simulated ? [<td>${simCost}</td>,<td>${(simCost-cost).toFixed(2)}</td>] : null }
                      </tr>
                    );
                  })
                }
                <tr>
                  <td>Total</td>
                  { production ? <td>{totalSolar.toFixed(2)} kWH</td> : null}
                  { simulated ? <td>{totalSimulated.toFixed(2)} kWH</td> : null}
                  <td>{totalGrid.toFixed(2)} kWH</td>
                  { simulated ? <td>{totalSimGrid.toFixed(2)} kWH</td> : null}
                  { production ? <td>{(totalSolar+totalGrid).toFixed(1)} kWH</td> : null }
                  <td>${totalCost.toFixed(2)}</td>
                  { simulated ? [<td>${totalSimCost.toFixed(2)}</td>,<td>${(totalSimCost-totalCost).toFixed(2)}</td>] : null }
                </tr>
              </tbody>
            </Table>
          </Card.Body>
        </Card>
        <PowerwallCard usage={this.props.usage} peakStart={ps} peakEnd={pe} peakRate={pr}
                       offStart={os} offEnd={oe} offRate={or} shoulderRate={sr} production={this.props.production}/>
      </div>
    );
  }
}