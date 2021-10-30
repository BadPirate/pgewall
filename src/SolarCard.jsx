import React from 'react'
import {
  Card, Button, Alert,
} from 'react-bootstrap'
import qs from 'query-string'
import ReactFileReader from 'react-file-reader'
import PropTypes from 'prop-types'
import { EnphaseAPI } from './Api'
import { logEvent } from './utils'
import SimulationCard from './SimulationCard'
import EnphaseComponent from './EnphaseComponent'
import { logError, logInfo } from './Logging.mjs'

const moment = require('moment')
const { Map } = require('immutable')
const dateFormat = require('dateformat')

export default class SolarCard extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      production: '',
      status: 'No data retrieved',
      enphaseUserID: '',
      enphaseSystems: '',
      selected: '',
      error: '',
    }
  }

  componentDidMount() {
    const { enphaseUserID, production } = this.state
    const parseID = qs.parse(window.location.search).user_id
    if (!enphaseUserID) {
      if (parseID) {
        localStorage.setItem('enphaseUserID', parseID)
        window.location = `${window.location.protocol}//${window.location.host}${window.location.pathname}`
      }
      const storedID = localStorage.getItem('enphaseUserID')
      if (storedID) {
        this.setState({
          enphaseUserID: storedID,
          status: 'Authenticated Enphase Enlighten.',
        })
        logEvent('EnphaseCard', 'authenticated')
      }
    }
    if (!production) {
      const cached = localStorage.getItem('production')
      if (cached) {
        this.setState({
          production: new Map(JSON.parse(cached)),
          status: 'Retrieved cached production data.',
        })
      }
    }
  }

  setProduction(key, power) {
    const { usage } = this.props
    this.setState((state) => {
      let map = state.production || new Map()
      map = map.set(key, power)
      const percentage = map.size / usage.size
      localStorage.setItem('production', JSON.stringify([...map]))
      logInfo(map.size, usage.size)
      return {
        production: map,
        status: `Retrieving production ${percentage.toFixed(3)}%...`,
      }
    })
  }

  selectSystem(systemID) {
    this.setState({
      selected: systemID,
    })
  }

  upload(files) {
    this.setState({
      production: '',
      status: 'Loading CSV...',
      enphaseUserID: '',
      enphaseSystems: '',
      selected: '',
      error: '',
    })
    const reader = new FileReader()
    reader.onload = () => {
      let production = new Map()
      const dates = new Set()
      let rows = 0
      let errors = 0
      reader.result.split('\n').forEach((line) => {
        const parts = line.split(',')
        let m = moment(parts[0])
        if (!m.isValid()) {
          const sub = parts[0].substr(0, 16)
          m = moment(sub)
          if (!m.isValid()) {
            logInfo(`Invalid date format - ${parts[0]} or ${sub}`)
            errors += 1
            return
          }
        }
        const date = m.toDate()
        const kw = parseInt(parts[1], 10) / 1000
        const key = `${dateFormat(date, 'yyyy-mm-dd,HH:00')}`
        dates.add(dateFormat(date, 'yyyy-mm-dd'))
        if (production.has(key)) {
          const samples = production.get(key)
          samples.push(kw)
          production = production.set(key, samples)
        } else {
          production = production.set(key, [kw])
        }
        rows += 1
      })
      let collapsed = new Map()
      production.forEach((values, key) => {
        let sum = 0
        values.forEach((v) => { sum += v })
        collapsed = collapsed.set(key, sum / values.length)
      })
      production = collapsed
      if (production.size === 0) {
        this.setState({
          error: 'No valid rows in CSV',
        })
      } else {
        localStorage.setItem('production', JSON.stringify([...production]))
        this.setState({
          status: `Loaded ${rows} rows from ${dates.size} days (${errors} errors) from CSV`,
          error: '',
          production,
        })
      }
      logEvent('SolarCard', 'loaded-csv')
    }
    reader.readAsText(files[0])
  }

  logoutEnphase() {
    localStorage.setItem('enphaseUserID', '')
    localStorage.setItem('production', '')
    this.setState({
      enphaseUserID: '',
      status: 'Logged out Enphase',
      enphaseSystems: '',
      selected: '',
      error: '',
      production: '',
    })
    logEvent('EnphaseCard', 'logout')
  }

  render() {
    const enphaseAppID = process.env.REACT_APP_ENPHASE_APP_ID
    const {
      enphaseUserID, error, enphaseSystems, status, selected, production,
    } = this.state
    const { usage } = this.props
    if (enphaseUserID && !error) {
      const api = new EnphaseAPI(enphaseUserID)
      if (!enphaseSystems && !error) {
        api.getSystems()
          .then((systems) => {
            if (systems.length > 0) {
              this.setState({
                enphaseSystems: systems,
                status: 'Systems loaded',
                selected: 0,
              })
            } else {
              throw new Error('No systems available')
            }
          })
          .catch((e) => {
            logError(error)
            this.setState({
              error: e.message,
              status: 'Enlighten error',
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
          { error ? <Alert variant="danger">{error}</Alert> : null }
          <Alert variant="info">{status}</Alert>
          <Card.Body>
            <Card.Text>
              When Solar is installed Powerwall can only charge from Solar (not grid).  In order to
              simulate we need to know about Solar Generation, currently
              (because it&apos;s what I use) this tool supports the Enlighten Systems
              monitoring API. If you&apos;d like it to support your use case
              {' '}
              <a href="https://github.com/BadPirate/pgewall/issues/new">file an issue</a>
              .
            </Card.Text>
            {
              enphaseAppID
                ? (
                  <EnphaseComponent
                    enphaseAppID={enphaseAppID}
                    enphaseUserID={enphaseUserID}
                    enphaseSystems={enphaseSystems}
                    selected={selected}
                    select={(systemID) => { this.selectSystem(systemID) }}
                    usage={usage}
                    logout={() => { this.logoutEnphase() }}
                    production={production}
                    setProduction={(key, power) => { this.setProduction(key, power) }}
                  />
                )
                : (
                  <Alert variant="danger">
                    Must set
                    {' '}
                    <code>REACT_APP_ENPHASE_APP_ID</code>
                    {' '}
                    environmental variable to Enphase Developer App ID in order to
                    enable Enphase integration
                  </Alert>
                )
            }
            <hr />
            <Card.Text>
              You can also upload your production data in a CSV with two colums:
            </Card.Text>
            <ul>
              <li>Date of the start of production period (any Javascript parseable format)</li>
              <li>
                Watt Hour Sample for that production period, will be averaged with other
                samples from the same hour
              </li>
            </ul>
            <Card.Text>Periods must be less than 1 hour to match with PGE Data.</Card.Text>
            <ReactFileReader handleFiles={(f) => this.upload(f)} fileTypes=".csv">
              <Button className="btn" variation="primary">Upload Production CSV</Button>
            </ReactFileReader>
          </Card.Body>
        </Card>
        { production ? <SimulationCard usage={usage} production={production} /> : null }
      </div>
    )
  }
}

SolarCard.propTypes = {
  usage: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
}
