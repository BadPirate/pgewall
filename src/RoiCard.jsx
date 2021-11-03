/* eslint-disable react/prefer-stateless-function */
/* eslint-disable react/no-unused-prop-types */
import React from 'react'
import PropTypes from 'prop-types'
import { Card } from 'react-bootstrap'
import moment from 'moment'
import PWCard from './PWCard'
import { pad } from './utils'

export default class RoiCard extends React.Component {
  render() {
    const {
      batteries, usage, production, simulated, rates, start,
    } = this.props
    const { storagePer, count, efficiency } = batteries

    let nowCost = 0
    let afterCost = 0
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

        let period = 's'
        let rate = rates.shoulderRate
        if (h >= rates.peakStart && h < rates.peakEnd) {
          rate = rates.peakRate
          period = 'p'
        } else if (h >= rates.offStart && h < rates.offEnd) {
          rate = rates.offRate
          period = 'o'
        }

        let gridUse = u + p // Original use (before addition of battery, etc)
        nowUseTotal[period] += gridUse
        nowCost += u * rate // Currently pay only for grid use

        let available = p + s // Going forward, will be able to charge with all solar

        let charged = 0
        if (available > 0 && b < bm && (period === 'o')) { // Charge battery
          charged = Math.min((bm / efficiency) - b, available)
          b += charged * efficiency // Count battery charge loss at charge time
          gridUse += charged // Any taken from solar will have to come from somewhere
          available -= charged
        }

        if (period === 'p' && u + (p > 0 ? p : 0) > 0 && b > 0) { // Use Battery
          const discharged = Math.min(gridUse, b)
          b -= discharged
          gridUse -= discharged
          if (b < lowestCharge) {
            lowestCharge = b
          }
        }
        const afterUse = gridUse - available
        afterUseTotal[period] += afterUse
        afterCost += afterUse * rate
      }
      m.day(m.day() + 1)
    }

    const body = (
      <div>
        <Card.Text>
          You&apos;ve got enough data in now to calculate.
          This tool works by simulating your setup,
          taking into consideration battery charge level, solar generation, and time of use rates.
          The end result should be an estimate of your annual savings.
        </Card.Text>
        <p>{`Current: $${Math.round(nowCost)}.  `}</p>
        <p>{`After: $${Math.round(afterCost)}${afterCost < 0 ? '(Likely capped at $0 by your provider)' : ''}.`}</p>
        <p>{`Annual savings: $${Math.round(nowCost - Math.max(0, afterCost))}`}</p>
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
