/* eslint-disable max-classes-per-file */
import React from 'react'
import {
  Card, Button, Tabs, Tab, Alert, Row, Col,
} from 'react-bootstrap'
import ReactFileReader from 'react-file-reader'
import moment from 'moment'
import { logEvent, pad } from './utils'
import { logError, logInfo } from './Logging.mjs'
import PWCard, { ContinueButton } from './PWCard'
import SolarCard from './SolarCard'
import { parseCSVs, CSVColumn } from './parseCSV'

const clearState = {
  progress: 'No Data Loaded',
  usage: '',
  needsSave: false,
  error: null,
}

export default class UsageCard extends React.Component {
  constructor(props) {
    super(props)
    this.state = clearState
  }

  componentDidMount() {
    let { usage } = this.state
    if (!usage && localStorage.getItem('usage')) {
      try {
        usage = JSON.parse(localStorage.getItem('usage'))
        this.setState({
          usage: new Map(usage),
        })
      } catch (e) {
        logError('Error retrieving stored usage', e)
        const failedState = clearState
        failedState.error = Error('Error retrieving stored usage')
        this.setState(failedState)
        localStorage.removeItem('usage')
      }
    }
  }

  handleFiles(files) {
    this.setState({
      error: null,
    })
    let { usage } = this.state
    if (!usage) {
      usage = new Map()
    }
    const added = new Map()

    const dateColumn = new CSVColumn('date', ['DATE'])
    const timeColumn = new CSVColumn('time', ['START TIME'])
    const dateTimeColumn = new CSVColumn('datetime', ['DATETIME'], [dateColumn])
    dateColumn.alternates = [dateTimeColumn]
    timeColumn.alternates = [dateTimeColumn]
    const kwhColumn = new CSVColumn('kwh', ['USAGE', 'kW'])
    const whColumn = new CSVColumn('wh', ['W'], [kwhColumn])
    kwhColumn.alternates = [whColumn]

    const columns = [
      dateColumn,
      timeColumn,
      dateTimeColumn,
      kwhColumn,
      whColumn,
    ]

    const onRow = ({
      time, date, kwh: kwhString, datetime, wh,
    }) => {
      let kwh
      if (kwhString) {
        kwh = parseFloat(kwhString)
      } else {
        kwh = parseFloat(wh / 1000)
      }
      if (Number.isNaN(kwh)) return

      let m
      if (datetime) {
        m = moment(datetime)
      } else {
        m = moment(`${date} ${time}`)
      }
      if (!m.isValid()) return
      m.minutes(0)

      const start = m.format('YYYY-MM-DD HH:mm')
      added.set(start, added.has(start) ? added.get(start) + kwh : kwh)
    }

    parseCSVs(files, columns, onRow)
      .then(() => {
        if (added.size === 0) {
          throw Error('No valid data found in that file')
        }
        const updated = new Map(usage)
        added.forEach((v, k) => {
          updated.set(k, v)
        })
        this.setState({
          usage: updated,
        })
        localStorage.setItem('usage', JSON.stringify([...updated]))

        logEvent('UsageCard', 'loaded-csv')
      })
      .catch((error) => {
        this.setState({
          error,
        })
      })
  }

  render() {
    const { error, usage, needsSave } = this.state
    const nextCard = null
    const title = 'Grid Usage'
    let body = null
    let validUsage = false
    let hasNeg = false
    let showImport = true
    let button = null
    let progress = null

    if (usage && usage.size > 0) {
      const days = new Map()
      let mcStart = null
      let mcEnd = null
      let completeCount = 0
      const partial = []
      const ratioDay = new Map()
      const averageDay = new Map()
      usage.forEach((value, key) => {
        const m = moment(key)
        if (!m.isValid()) {
          return
        }
        const daysKey = m.format('YYYY-MM-DD')
        if (!days.has(daysKey)) {
          days.set(daysKey, new Map())
        }
        const hours = days.get(daysKey)
        hours.set(m.hour(), value)
        days.set(daysKey, hours)
      })
      let contiguousStart = null
      let contiguousEnd = null
      let totalUse = 0
      let useBase = 0
      Array.from(days.keys()).sort().forEach((dk) => {
        const m = moment(dk)
        if (!contiguousStart) {
          contiguousStart = m
          contiguousEnd = m
        }
        if (!mcStart) {
          mcStart = contiguousStart
          mcEnd = contiguousEnd
        }
        if (m.diff(contiguousEnd, 'days') === 1) {
          contiguousEnd = m
        }
        if (contiguousEnd.diff(contiguousStart, 'days') > mcEnd.diff(mcStart, 'days')) {
          mcStart = contiguousStart
          mcEnd = contiguousEnd
        }
        const day = days.get(dk)
        if (day && (day.size === 24 || day.size === 23) /* probably dst */) {
          completeCount += 1
          day.forEach((v, i) => {
            ratioDay.set(i, (ratioDay.get(i) || 0) + v)
            averageDay.set(i, (ratioDay.get(i) || 0) + v)
            totalUse += v
            useBase += 1
            if (v < 0) hasNeg = true
          })
        } else {
          logInfo('Partial', day ? day.size : 0, day, dk)
          partial.push(dk)
        }
      })
      const contiguous = mcEnd.diff(mcStart, 'days') + 1
      progress = `Days: ${partial.length} partial/${completeCount} complete, Longest Contiguous: ${contiguous}d, ${mcStart.format('YYYY-MM-DD')} - ${mcEnd.format('YYYY-MM-DD')} `

      if (completeCount > 365 && contiguous > 365) { // Over
        progress = `${contiguous} contiguous complete days, needs trimming`
        showImport = false
        const trimBefore = moment(contiguousEnd)
        trimBefore.subtract(364, 'days')
        const trimAfter = moment(contiguousStart)
        trimAfter.add(364, 'days')
        body = (
          <div>
            <Alert variant="info">
              To keep things simple this tool only uses 365 days for calculation, you have
              {' '}
              {contiguous}
              {' '}
              days.
            </Alert>
            <Row>
              <Col xs="auto">
                <Button
                  variant="info"
                  onClick={() => {
                    const u = new Map()
                    usage.forEach((v, k) => {
                      const m = moment(k)
                      if (m < trimBefore) return
                      u.set(k, v)
                    })
                    this.setState({
                      usage: u,
                      needsSave: true,
                    })
                  }}
                >
                  Trim before
                  {' '}
                  {trimBefore.format('YYYY-MM-DD')}
                </Button>
              </Col>
              <Col xs="auto">
                <Button
                  variant="info"
                  onClick={() => {
                    const u = new Map()
                    usage.forEach((v, k) => {
                      const m = moment(k)
                      if (m > trimAfter) return
                      u.set(k, v)
                    })
                    this.setState({
                      usage: u,
                      needsSave: true,
                    })
                  }}
                >
                  Trim after
                  {' '}
                  {trimAfter.format('YYYY-MM-DD')}
                </Button>
              </Col>
            </Row>
          </div>
        )
      } else if (completeCount < 365 || contiguous < 365) { // Under
        progress = `${mcStart.format('YYYY-MM-DD')} - ${mcEnd.format('YYYY-MM-DD')} - Average daily grid use: ${Math.round(totalUse / useBase)} kWH Missing ${365 - contiguous} days`
        validUsage = partial.length === 0 && completeCount === 365 && contiguous === 365
        if (partial.length > 0 && completeCount > 0) {
          button = (
            <Col xs="auto">
              <Button
                variant="info"
                onClick={() => {
                  const update = new Map(usage)
                  let totalRatio = 0
                  ratioDay.forEach((v) => {
                    totalRatio += v
                  })
                  partial.forEach((dk) => {
                    logInfo('before', update ? update.size : 0)
                    const day = days.get(dk)
                    let dayTotal = 0
                    day.forEach((v) => {
                      dayTotal += v
                    })
                    for (let hour = 0; hour < 24; hour += 1) {
                      const r = ratioDay.get(hour) / totalRatio
                      const usageKey = `${dk} ${pad(hour, 2)}:00`
                      update.set(usageKey, r * dayTotal)
                    }
                  })
                  this.setState({
                    usage: update,
                    needsSave: true,
                  })
                }}
              >
                Estimate partial days based on average usage distribution
              </Button>
            </Col>
          )
        } else if (contiguous < 365 && partial.length === 0 && completeCount > 0) {
          button = (
            <Col xs="auto">
              <Button
                variant="info"
                onClick={() => {
                  const updated = new Map(usage)
                  let remaining = 365 - contiguous
                  const on = moment(mcStart)
                  while (remaining > 0) {
                    remaining -= 1
                    on.day(on.day() - 1)
                    if (usage.has(`${on.format('YYYY-MM-DD')} 00:00`)) {
                      // eslint-disable-next-line no-continue
                      continue // Already g2g on this day
                    }
                    for (let hour = 0; hour < 24; hour += 1) {
                      const hourKey = pad(hour, 2)
                      updated.set(`${on.format('YYYY-MM-DD')} ${hourKey}:00`, averageDay.get(hour) / completeCount)
                    }
                  }
                  this.setState({
                    usage: updated,
                    needsSave: true,
                  })
                }}
              >
                Estimate missing days based on average hourly usage
              </Button>
            </Col>
          )
        }
      } else if (completeCount === 365 && contiguous === 365) { // Just right\
        button = <ContinueButton title="Add solar production" />
        showImport = false
        validUsage = true
        progress = `365 days.  Average daily grid use: ${Math.round(totalUse / useBase)} kW`
      }
    }

    if (showImport) {
      body = (
        <div>
          <Card.Text>
            To estimate year round ROI, you&apos;ll need 365 contiguous days of grid usage data.
            This can be retrieved and uploaded from your service provider, simulated, or estimated
            based off partial data.  To best estimate ROI, it is likely best to upload just the time
            periods for which your grid use was typical, and to use that data then to estimate
            the use for atypical periods in your data.
          </Card.Text>
          <Tabs defaultActiveKey="pge">
            <Tab title="PG&amp;E" eventKey="pge" key="pge">
              <ul>
                <li>
                  Go to PG&amp;E website, login and open
                  {' '}
                  <a href="https://pge.opower.com/ei/x/energy-usage-details" target="new">&quot;Energy Details&quot;</a>
                </li>
                <li>Select the green button &quot;Download my data&quot;</li>
                <li>
                  Select radio button for &quot;Export usage for a range of days&quot;
                  and select a period up to 365 days long that contains typical grid use
                  for the given period.
                </li>
                <li>Upload electric csv below</li>
                <li>Repeat until you have uploaded all periods of typical use</li>
              </ul>
              <ReactFileReader multipleFiles handleFiles={(f) => this.handleFiles(f)} fileTypes=".csv">
                <Button className="btn" variation="primary">Upload</Button>
              </ReactFileReader>
            </Tab>
            <Tab title="CSV" eventKey="csv" key="csv">
              CVS needs 3 columns:
              <ul>
                <li>Either:</li>
                <ul>
                  <li>
                    <b>DATE</b>
                    {' '}
                    (YYYY-MM-DD)
                    {' '}
                    <u>and</u>
                    {' '}
                    <b>START TIME</b>
                    {' '}
                    (HH:mm)
                  </li>
                  <li>
                    Or a single date time:
                    {' '}
                    <b>DATETIME</b>
                    {' '}
                    (YYYY-MM-DD HH:mm)
                  </li>
                </ul>
                <li>
                  Either:
                </li>
                <ul>
                  <li>
                    <b>kW</b>
                    {' '}
                    (kW)
                  </li>
                  <li>
                    <b>W</b>
                    {' '}
                    (W)
                  </li>
                </ul>
              </ul>
              <Row>
                <Col xs="auto">
                  <Button variant="info" href="/sample_usage.csv">
                    Download Date and Time Template
                  </Button>
                </Col>
                <Col xs="auto">
                  <Button variant="info" href="/sample_usage_dt.csv">
                    Download Datetime Template
                  </Button>
                </Col>
                <Col xs="auto">
                  <ReactFileReader handleFiles={(f) => this.handleFiles(f)} fileTypes=".csv">
                    <Button className="btn" variation="primary">Upload</Button>
                  </ReactFileReader>
                </Col>
              </Row>
            </Tab>
          </Tabs>
          {body}
        </div>
      )
    }

    body = (
      <div>
        {body}
        { progress ? (
          <Alert
            variant={!validUsage ? 'warning' : 'success'}
          >
            {progress}
          </Alert>
        ) : null }
        <Row style={{ marginTop: '1em' }}>
          { button }
          { needsSave ? (
            <Col xs="auto">
              <Button
                variant="info"
                onClick={() => {
                  localStorage.setItem('usage', JSON.stringify([...usage]))
                  this.setState({
                    needsSave: false,
                  })
                }}
              >
                Save estimated data locally
              </Button>
            </Col>
          ) : null}
          <Col fluid={1} />
          <Col xs="auto">
            <Button
              variant="danger"
              onClick={() => {
                this.setState({
                  usage: null,
                })
                localStorage.removeItem('usage')
              }}
            >
              Clear
            </Button>
          </Col>
        </Row>
      </div>
    )

    return [(
      <PWCard
        progress={progress}
        title={title}
        body={body}
        key="usage"
        error={error}
        next={
        validUsage ? <SolarCard usage={usage} hasNeg={hasNeg} key="solar" /> : null
      }
      />
    ), nextCard]
  }
}
