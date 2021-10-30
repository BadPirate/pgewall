import React from 'react'
import PropTypes from 'prop-types'
import {
  Card, Table, InputGroup, FormControl,
} from 'react-bootstrap'
import PowerwallCard from './PowerwallCard'
import { dayOfYear } from './utils'

export default class RateCard extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      peakStart: '14:00',
      peakEnd: '21:00',
      peakRate: '.51832',
      offStart: '23:00',
      offEnd: '07:00',
      offRate: '.13452',
      shoulderRate: '.28096',
    }
  }

  update(name, value) {
    const map = new Map([[name, value]])
    this.setState(map)
  }

  render() {
    const { simulated, production, usage } = this.props
    const {
      peakStart, peakEnd, offStart, offEnd, peakRate, offRate, shoulderRate,
    } = this.state
    const periods = new Map(
      [['peak', 0],
        ['offpeak', 0],
        ['shoulder', 0]],
    )
    const simPeriods = simulated ? new Map(
      [['peak', 0],
        ['offpeak', 0],
        ['shoulder', 0]],
    ) : null
    const tp = production ? new Map(
      [['peak', 0],
        ['offpeak', 0],
        ['shoulder', 0]],
    ) : null
    const ts = simulated ? new Map(
      [['peak', 0],
        ['offpeak', 0],
        ['shoulder', 0]],
    ) : null
    const ps = parseInt(peakStart.split(':')[0], 10)
    const pe = parseInt(peakEnd.split(':')[0], 10)
    const os = parseInt(offStart.split(':')[0], 10)
    const oe = parseInt(offEnd.split(':')[0], 10)
    const pr = parseFloat(peakRate)
    const or = parseFloat(offRate)
    const sr = parseFloat(shoulderRate)
    let totalCost = 0
    let totalSimCost = 0
    let totalGrid = 0
    let totalSolar = 0
    let totalSimulated = 0
    let totalSimGrid = 0
    let firstDate = ''
    let lastDate = ''
    usage.forEach((value, key) => {
      if (production && !production.has(key)) return
      const p = (production && production.has(key)) ? production.get(key) : 0
      totalSolar += p
      totalGrid += value
      const date = key.split(',')[0]
      if (!firstDate || date < firstDate) {
        firstDate = date
      }
      if (!lastDate || date > lastDate) {
        lastDate = date
      }
      const parts = key.split(',')[1].split(':')
      const time = parseInt(parts[0], 10)
      let s = 0
      if (simulated) {
        const doy = dayOfYear(date)
        s = simulated.get(`${doy}-${parseInt(time, 10)}`)
        totalSimulated += s
        totalSimGrid += value - s
      }
      if (time >= ps && time < pe) {
        periods.set('peak', periods.get('peak') + value)
        if (ts) simPeriods.set('peak', simPeriods.get('peak') + (value - s))
        if (tp) tp.set('peak', tp.get('peak') + p)
        if (ts) ts.set('peak', ts.get('peak') + s)
        totalCost += value * pr
        totalSimCost += (value - s) * pr
      } else if ((os > pe && time >= os && time < 24)
                 || (time < oe)) {
        periods.set('offpeak', periods.get('offpeak') + value)
        if (ts) simPeriods.set('offpeak', simPeriods.get('offpeak') + (value - s))
        if (tp) tp.set('offpeak', tp.get('offpeak') + p)
        if (ts) ts.set('offpeak', ts.get('offpeak') + s)
        totalCost += value * or
        totalSimCost += (value - s) * or
      } else {
        periods.set('shoulder', periods.get('shoulder') + value)
        if (ts) simPeriods.set('shoulder', simPeriods.get('shoulder') + (value - s))
        if (tp) tp.set('shoulder', tp.get('shoulder') + p)
        if (ts) ts.set('shoulder', ts.get('shoulder') + s)
        totalCost += value * sr
        totalSimCost += (value - s) * sr
      }
    })
    return (
      <div>
        <Card>
          <Card.Header>
            Update Rate Periods
          </Card.Header>
          <Card.Body>
            <Card.Text>
              Now you&apos;ll need to lookup the hours of your various rate periods and their rates,
              and adjust these fields below as needed.  I&apos;ve filled out 2019 rate for the EV-A
              plan. Note, that some Time of Use plans have different rates during winter and summer
              months, currently this is not supported, because the arbitrage is less valuable in
              those cases so likely it&apos;s a worse plan for this strategy in general.  This will
              return total usage and potential savings for the period you uploaded.
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
              <FormControl as="input" onChange={(e) => { this.setState({ peakStart: e.target.value }) }} value={peakStart} />
              <InputGroup.Text>
                To
              </InputGroup.Text>
              <FormControl as="input" onChange={(e) => { this.setState({ peakEnd: e.target.value }) }} value={peakEnd} />
              <InputGroup.Text>
                Rate
              </InputGroup.Text>
              <FormControl as="input" onChange={(e) => { this.setState({ peakRate: e.target.value }) }} value={peakRate} />
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
              <FormControl as="input" onChange={(e) => { this.setState({ offStart: e.target.value }) }} value={offStart} />
              <InputGroup.Text>
                To
              </InputGroup.Text>
              <FormControl as="input" onChange={(e) => { this.setState({ offEnd: e.target.value }) }} value={offEnd} />
              <InputGroup.Text>
                Rate
              </InputGroup.Text>
              <FormControl as="input" onChange={(e) => { this.setState({ offRate: e.target.value }) }} value={offRate} />
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
              <FormControl as="input" onChange={(e) => { this.setState({ shoulderRate: e.target.value }) }} value={shoulderRate} />
            </InputGroup>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>
                    Period
                    {' '}
                    {firstDate}
                    {' '}
                    to
                    {' '}
                    {lastDate}
                  </th>
                  { production ? <th>Solar Production</th> : null }
                  { simulated ? <th>Simulated Solar</th> : null }
                  <th>Grid Use</th>
                  { simulated ? <th>Simulated Grid</th> : null }
                  { production ? <th>Total Use</th> : null }
                  <th>Cost</th>
                  { simulated ? [<th>Simulated Cost</th>, <th>Simulated Savings</th>] : null}
                </tr>
              </thead>
              <tbody>
                {
                  Array.from(periods, ([key, value]) => {
                    const p = production ? tp.get(key) : 0
                    const s = simulated ? ts.get(key) : 0
                    let r = sr
                    if (key === 'peak') {
                      r = pr
                    } else if (key === 'offpeak') {
                      r = or
                    }
                    const cost = (value * r).toFixed(2)
                    const simValue = simulated ? simPeriods.get(key) : 0
                    const simCost = simulated ? (simValue * r).toFixed(2) : 0
                    return (
                      <tr key={key}>
                        <td>{key}</td>
                        { production ? (
                          <td>
                            {p.toFixed(2)}
                            {' '}
                            kWH
                          </td>
                        ) : null }
                        { simulated ? (
                          <td>
                            {s.toFixed(2)}
                            {' '}
                            kWH
                          </td>
                        ) : null}
                        <td>
                          {value.toFixed(2)}
                          {' '}
                          kWH
                        </td>
                        { simulated ? (
                          <td>
                            {simValue.toFixed(2)}
                            {' '}
                            kWH
                          </td>
                        ) : null }
                        { production ? (
                          <td>
                            {(value + p).toFixed(2)}
                            {' '}
                            kWH
                          </td>
                        ) : null }
                        <td>
                          $
                          {cost}
                        </td>
                        { simulated ? [
                          <td>
                            $
                            {simCost}
                          </td>,
                          <td>
                            $
                            {(cost - simCost).toFixed(2)}
                          </td>,
                        ] : null }
                      </tr>
                    )
                  })
                }
                <tr>
                  <td>Total</td>
                  { production ? (
                    <td>
                      {totalSolar.toFixed(2)}
                      {' '}
                      kWH
                    </td>
                  ) : null}
                  { simulated ? (
                    <td>
                      {totalSimulated.toFixed(2)}
                      {' '}
                      kWH
                    </td>
                  ) : null}
                  <td>
                    {totalGrid.toFixed(2)}
                    {' '}
                    kWH
                  </td>
                  { simulated ? (
                    <td>
                      {totalSimGrid.toFixed(2)}
                      {' '}
                      kWH
                    </td>
                  ) : null}
                  { production ? (
                    <td>
                      {(totalSolar + totalGrid).toFixed(1)}
                      {' '}
                      kWH
                    </td>
                  ) : null }
                  <td>
                    $
                    {totalCost.toFixed(2)}
                  </td>
                  { simulated ? [
                    <td>
                      $
                      {totalSimCost.toFixed(2)}
                    </td>,
                    <td>
                      $
                      {(totalCost - totalSimCost).toFixed(2)}
                    </td>] : null }
                </tr>
              </tbody>
            </Table>
          </Card.Body>
        </Card>
        <PowerwallCard
          usage={usage}
          peakStart={ps}
          peakEnd={pe}
          peakRate={pr}
          simulated={simulated}
          offStart={os}
          offEnd={oe}
          offRate={or}
          shoulderRate={sr}
          production={production}
        />
      </div>
    )
  }
}

RateCard.propTypes = {
  simulated: PropTypes.bool,
  production: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)),
  usage: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
}

RateCard.defaultProps = {
  simulated: false,
  production: null,
}
