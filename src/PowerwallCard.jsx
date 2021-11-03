import React from 'react'
import PropTypes from 'prop-types'
import {
  Card, InputGroup, FormControl,
} from 'react-bootstrap'
import moment from 'moment'
import PWCard from './PWCard'
import RoiCard from './RoiCard'

export default class PowerwallCard extends React.Component {
  constructor(props) {
    super(props)
    const batteries = {
      count: 1,
      storagePer: 13.5,
      efficiency: 0.9,
    }
    this.state = {
      batteries,
    }
  }

  render() {
    const { batteries } = this.state
    const { count, storagePer, efficiency } = batteries
    const {
      usage, production, simulated, rates, start,
    } = this.props

    const body = (
      <div>
        <Card.Text>
          Now provide information about the powerwall(s) you are considering.  I prefilled
          with the numbers I have for the Powerwall 2.  Replace the usable storage amount with
          a reduced number if you want to have some minimum amount of storage available for
          house backup.  Use 0 batteries to compare to existing details.
        </Card.Text>
        <InputGroup>
          <InputGroup.Text>
            Number of Batteries
          </InputGroup.Text>
          <FormControl
            as="input"
            onChange={(e) => {
              const u = { ...batteries }
              u.count = e.target.value
              this.setState({
                batteries: u,
              })
            }}
            value={count}
          />
          {
                (parseInt(count, 10) !== 0)
                  ? [
                    <InputGroup.Text>
                      Usable Storage per Battery (kWH)
                    </InputGroup.Text>,
                    <FormControl
                      as="input"
                      onChange={(e) => {
                        const u = { ...batteries }
                        u.storagePer = e.target.value
                        this.setState({
                          batteries: u,
                        })
                      }}
                      value={storagePer}
                    />,
                    <InputGroup.Text>
                      Round Trip Efficiency
                    </InputGroup.Text>,
                    <FormControl
                      as="input"
                      onChange={(e) => {
                        const u = { ...batteries }
                        u.efficiency = e.target.value
                        this.setState({
                          batteries: u,
                        })
                      }}
                      value={efficiency}
                    />,
                  ] : null
              }
        </InputGroup>
      </div>
    )
    const progress = `${count} ${count !== 1 ? 'batteries' : 'battery'}${count > 0 ? `, usable storage: ${count * storagePer} kWh` : ''}`
    const next = (
      <RoiCard
        usage={usage}
        production={production}
        simulated={simulated}
        rates={rates}
        batteries={batteries}
        key="roi"
        start={start}
      />
    )
    return (
      <PWCard title="Powerwall Information" body={body} progress={progress} next={next} start={start} key="powerwall" />
    )
  }
}

PowerwallCard.propTypes = {
  simulated: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)),
  rates: PropTypes.objectOf(PropTypes.number).isRequired,
  usage: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
  production: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)),
  start: PropTypes.instanceOf(moment).isRequired,
}

PowerwallCard.defaultProps = {
  production: null,
  simulated: null,
}
