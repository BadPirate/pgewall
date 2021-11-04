import React from 'react'
import ReactFileReader from 'react-file-reader'
import PropTypes from 'prop-types'
import {
  Card, Button, ToggleButtonGroup, Tabs, Tab, Alert, Row, Col,
} from 'react-bootstrap'
import { logEvent } from './utils'
import { logError, logInfo } from './Logging.mjs'
import PWCard, { ContinueButton } from './PWCard'
import SimulationCard from './SimulationCard'
import { CSVColumn, parseCSVs } from './parseCSV'
import prodCalculation from './prodCalculation'

const moment = require('moment')

function NoSolarProductionTab({ hasNeg }) {
  return (
    <div>
      {hasNeg ? (
        <Alert variant="danger">
          Warning, your usage shows negative values, indicating that
          you have some form of production  already.  If this is solar,
          please select the solar option above and upload solar data.
          Without it, ROI will be difficult to calculate properly / unreliable
        </Alert>
      ) : null}
      <Row>
        <Col xs="auto">
          {hasNeg ? <ContinueButton title="I know what I'm doing" variant="danger" /> : <ContinueButton />}
        </Col>
      </Row>
    </div>
  )
}

NoSolarProductionTab.propTypes = {
  hasNeg: PropTypes.bool.isRequired,
}

export default class SolarCard extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      production: null,
    }
  }

  componentDidMount() {
    const { production, haveSolar } = this.state
    if (!production) {
      const cached = localStorage.getItem('production')
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          this.setState({
            production: new Map(parsed),
          })
        } catch (e) {
          localStorage.removeItem('production')
          this.setState({
            error: 'Error loading saved production, cleared',
          })
          logError(e, cached)
        }
      }
    }
    if (!haveSolar) {
      const cached = localStorage.getItem('haveSolar')
      if (cached) {
        this.setState({
          haveSolar: cached,
        })
      }
    }
  }

  upload(files) {
    this.setState({
      error: null,
    })

    let { production } = this.state
    production = production || new Map()
    const added = new Map()

    const kwc = new CSVColumn('kw', ['Solar Energy (kWh)', 'Solar (kW)'])
    const wc = new CSVColumn('w', ['Energy Produced (Wh)'], [kwc])
    kwc.alternates = [wc]
    const columns = [
      new CSVColumn('datetime', ['Date time', 'Date/Time']),
      kwc,
      wc,
    ]
    const onRow = ({ datetime, kw, w }) => {
      const dp = parseFloat(kw || w / 1000)
      if (Number.isNaN(dp)) return

      const m = moment(datetime)
      if (!m.isValid()) return
      m.minute(0)
      const dk = m.format('YYYY-MM-DD HH:mm')
      added.set(dk, added.has(dk) ? added.get(dk) + dp : dp)
    }

    parseCSVs(files, columns, onRow)
      .then(() => {
        if (added.size === 0) {
          throw Error('No rows added')
        }
        const u = new Map(production)
        added.forEach((v, k) => u.set(k, v))
        this.setState({
          production: u,
        })
        localStorage.setItem('production', JSON.stringify([...u]))
        logEvent('SolarCard', 'loaded-csv')
      })
      .catch((error) => {
        this.setState({
          error,
        })
      })
  }

  uploadSolarTab() {
    const { production } = this.state
    const { usage } = this.props
    let status = null
    let solarBody = null
    let summaryAlert = null
    let earliest = null
    let latest = null
    let partial = null
    let complete = null
    let next = null
    let truncatedProduction = null

    let variant = 'warning'
    if (!production) {
      status = 'No solar production loaded'
    } else {
      let average
      let valid
      ({
        average, valid, earliest, latest, complete, partial, truncatedProduction,
      } = prodCalculation(usage, production))
      const averageDaily = Math.round(average)
      if (valid) {
        status = `${complete.size} days, average daily production: ${averageDaily} kW`
        variant = 'success'
      } else if ((!partial || partial.size === 0) && (!complete || complete.size === 0)) {
        status = 'No data loaded'
      } else {
        status = `${complete.size}d complete / ${partial.size}d partial, average daily production ${averageDaily}kW, between ${earliest.format('YYYY-MM-DD')} and ${latest.format('YYYY-MM-DD')}`
      }
      summaryAlert = <Alert variant={variant}>{status}</Alert>
    }

    const completeCount = complete ? complete.size : 0
    const partialCount = partial ? partial.size : 0

    solarBody = (
      <div>
        <Tabs defaultActiveKey="enphase">
          <Tab eventKey="enphase" title="Enphase Enlighten">
            <Card.Text>Import solar production data from Enphase</Card.Text>
            <ul>
              <li>Go to enlighten website</li>
              <li>Select My enlighten to get to dashboard</li>
              <li>Select Menu, Reports to get to report generate screen</li>
              <li>Pick time window and select daily report</li>
              <li>Upload below</li>
            </ul>
            <ReactFileReader multipleFiles handleFiles={(f) => this.upload(f)} fileTypes=".csv">
              <Button className="btn" variation="primary">Upload Production CSV</Button>
            </ReactFileReader>
          </Tab>
          <Tab eventKey="tesla" title="Tesla">
            <Card.Text>Import solar production data from Tesla</Card.Text>
            <ul>
              <li>Open Tesla Mobile App</li>
              <li>Go to Energy</li>
              <li>
                Export each month for your usage period (that you have) using
                Download My Data option
              </li>
              <li>Upload below</li>
            </ul>
            <ReactFileReader handleFiles={(f) => this.upload(f)} fileTypes=".csv">
              <Button className="btn" variation="primary">Upload Production CSV</Button>
            </ReactFileReader>
          </Tab>
          <Tab eventKey="csv" title="CSV">
            <Card.Text>Import solar production data from CSV</Card.Text>
            <ul>
              <li>
                <b>Date time</b>
                : RFC standard date time stamp, if there are multiple per hour they
                will be joined into hourly production
              </li>
              <li>
                <b>Solar (kW)</b>
                : kW generated starting with Date Time and
                ending with next entry
              </li>
            </ul>
            <Row>
              <Col xs="auto">
                <Button variant="info" href="/sample_production.csv">Download Template</Button>
              </Col>
              <Col xs="auto">
                <ReactFileReader handleFiles={(f) => this.upload(f)} fileTypes=".csv">
                  <Button className="btn" variation="primary">Upload Production CSV</Button>
                </ReactFileReader>
              </Col>
            </Row>
          </Tab>
        </Tabs>
        <div style={{ marginTop: '1em' }}>
          {summaryAlert}
        </div>
        <Row>
          {completeCount + partialCount > 0 && completeCount < 365 ? (
            <Col xs="auto">
              <ContinueButton title="Fill in missing solar information using simulator" />
            </Col>
          ) : null }
          {completeCount >= 365 ? (
            <Col xs="auto">
              <ContinueButton />
            </Col>
          ) : null }
          <Col fluid={1} />
          {completeCount + partialCount > 0 ? (
            <Col xs="auto">
              <Button
                variant="danger"
                onClick={() => {
                  this.setState({
                    production: new Map(),
                  })
                  localStorage.removeItem('production')
                }}
              >
                Reset
              </Button>
            </Col>
          ) : null}
        </Row>
      </div>
    )
    if (truncatedProduction && truncatedProduction.size > 0) {
      next = <SimulationCard usage={usage} production={truncatedProduction} key="simulate" />
    }
    return {
      status, summaryAlert, solarBody, next,
    }
  }

  render() {
    const {
      error, production, haveSolar,
    } = this.state
    const { usage, hasNeg } = this.props

    logInfo(hasNeg)

    let summaryAlert = null
    let solarBody = null
    let status = null
    let next = null

    switch (haveSolar) {
      case 'have':
        ({
          status, summaryAlert, solarBody, next,
        } = this.uploadSolarTab(production,
          status, usage, summaryAlert, solarBody, error))
        break
      case 'want':
        solarBody = <NoSolarProductionTab hasNeg={hasNeg} />
        next = <SimulationCard usage={usage} production={new Map()} key="simulation" />
        status = 'No current solar provided'
        break
      case 'none':
        solarBody = <NoSolarProductionTab hasNeg={hasNeg} />
        status = 'No current solar provided'
        break
      default: break
    }

    const updateHave = (value) => this.setState({
      haveSolar: value,
    })
    function ModeToggleButton(props) {
      return (
        <Button
          key={props.buttonValue}
          variant={haveSolar === props.buttonValue ? 'primary' : 'secondary'}
          value={props.buttonValue}
          onClick={() => {
            localStorage.setItem('haveSolar', props.buttonValue)
            updateHave(props.buttonValue)
          }}
        >
          {props.buttonTitle}
        </Button>
      )
    }

    const body = (
      <div>
        <Card.Text key="assume">
          For this utility, it is assumed that your electric utility functions like PG&amp;E,
          Which is to say, if you have solar (or are planning to add solar)
          you will be on NEM (Net energy metering) where the utility company pays you for time
          of use when you put electricity back on the grid at the same rate it would charge
          you for taking electric off the grid.  Additionally, if you have NEM and a powerwall
          it is assumed that you will not be allowed to charge powerwall from grid, but instead
          will have to charge from solar alone.  Thus, if you have solar currently you must
          upload production data to align with your usage data.  If you do not have solar you
          may choose to simulate solar production to see what kind of savings that might provide
          on its own, or with some new powerwalls.
        </Card.Text>
        <ToggleButtonGroup type="radio" name="mode" style={{ marginBottom: '1em' }}>
          <ModeToggleButton buttonValue="have" buttonTitle="Currently have solar" />
          <ModeToggleButton buttonValue="want" buttonTitle="Do not have solar, want to add" />
          <ModeToggleButton buttonValue="none" buttonTitle="Do not have / want solar" />
        </ToggleButtonGroup>
        {solarBody}
        {error ? (
          <Alert variant="danger">
            {error}
          </Alert>
        ) : null}
      </div>
    )
    return (
      <PWCard title="Solar Production" key="solar" body={body} progress={status} next={next} />
    )
  }
}

SolarCard.propTypes = {
  usage: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
  hasNeg: PropTypes.bool,
}

SolarCard.defaultProps = {
  hasNeg: false,
}
