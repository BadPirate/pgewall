/* eslint-disable react/prefer-stateless-function */
/* eslint-disable react/no-unused-prop-types */
import React from 'react'
import PropTypes from 'prop-types'
import { Card, Table } from 'react-bootstrap'
import moment from 'moment'
import PWCard from './PWCard'
import { pad } from './utils'

export default class RoiCard extends React.Component {
  render() {
    const {
      batteries, usage, production, simulated, rates, start,
    } = this.props
    const { storagePer, count, efficiency } = batteries

    const nowUseTotal = { p: 0, s: 0, o: 0 }
    const afterUseTotal = { p: 0, s: 0, o: 0 }
    let lowestCharge = 0

    const m = moment(start)
    const bm = count * storagePer * efficiency
    let b = bm
    lowestCharge = bm
    for (let d = 0; d < 365; d += 1) {
      for (let h = 0; h < 24; h += 1) {
        const key = `${m.format('YYYY-MM-DD')} ${pad(h, 2)}:00`
        const u = usage.has(key) ? usage.get(key) : 0
        const p = production && production.has(key) ? production.get(key) : 0
        const s = simulated && simulated.has(key) ? simulated.get(key) : 0

        let period = 'o'
        if (h >= rates.peakStart && h < rates.peakEnd) {
          period = 'p'
        } else if (h >= rates.shoulderStart && h < rates.shoulderEnd) {
          period = 's'
        }

        let gridUse = u
        nowUseTotal[period] += gridUse

        // Additional Solar
        gridUse -= s // Reduce grid use by new solar

        switch (period) {
          case 'p':
            // Discharge battery
            if (b > 0 && gridUse > 0) {
              const discharge = Math.min(gridUse / efficiency, b)
              b -= discharge
              gridUse -= discharge * efficiency
            }
            break
          default:
            {
            // Charge Battery
              const availableSolar = p + s
              if (availableSolar > 0 && b < bm) {
                const charge = Math.min(bm - b, availableSolar)
                b += charge
                gridUse += charge // Taking it from the grid... sooo.
              }
            }
            break
        }

        if (b < lowestCharge) lowestCharge = b

        afterUseTotal[period] += gridUse
      }
      m.day(m.day() + 1)
    }

    function DiffRow({ title, before, after }) {
      return (
        <tr>
          <td>{title}</td>
          <td>{Math.round(before)}</td>
          <td>{Math.round(after)}</td>
          <td>{Math.round(after - before)}</td>
        </tr>
      )
    }

    const cost = (group) => group.p * rates.peakRate + group.o * rates.offRate
    + group.s * rates.shoulderRate

    const body = (
      <div>
        <Card.Text>
          You&apos;ve got enough data in now to calculate.
          This tool works by simulating your setup,
          taking into consideration battery charge level, solar generation, and time of use rates.
          The end result should be an estimate of your annual savings.
        </Card.Text>
        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th> </th>
              <th>Before</th>
              <th>After</th>
              <th>Difference</th>
            </tr>
          </thead>
          <tbody>
            <DiffRow title="Peak (kw)" before={nowUseTotal.p} after={afterUseTotal.p} />
            { nowUseTotal.s > 0 || afterUseTotal.s > 0
              ? <DiffRow title="Shoulder (kw)" before={nowUseTotal.s} after={afterUseTotal.s} /> : null }
            <DiffRow title="Off Peak (kw)" before={nowUseTotal.o} after={afterUseTotal.o} />
            <DiffRow title="Cost ($)" before={cost(nowUseTotal)} after={cost(afterUseTotal)} />
          </tbody>
        </Table>
        <p>{`Lowest battery charge ${Math.round(lowestCharge)} kW`}</p>
      </div>
    )
    return (
      <PWCard title="Return on Investment" body={body} />
    )
  }
}

RoiCard.propTypes = {
  simulated: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)),
  rates: PropTypes.objectOf(PropTypes.number).isRequired,
  batteries: PropTypes.objectOf(PropTypes.number).isRequired,
  production: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)),
  usage: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
  start: PropTypes.instanceOf(moment).isRequired,
}

RoiCard.defaultProps = {
  simulated: null,
  production: null,
}
