import { logError } from './Logging.mjs'

const moment = require('moment')

export default function prodCalculation(usage, production) {
  let earliest = null
  let latest = null

  const complete = new Map()
  const partial = new Map()

  const truncatedProduction = new Map()
  let average = 0
  let averageCount = 0
  let outOfScopeDays = 0
  const usageDays = new Set()
  usage.forEach((v, k) => {
    const m = moment(k)
    const dk = m.format('YYYY-MM-DD')
    usageDays.add(dk)
  })
  const prodDays = new Map()
  production.forEach((v, k) => {
    const m = moment(k)
    if (!m.isValid()) {
      logError('Invalid date', k)
      return
    }
    const dk = m.format('YYYY-MM-DD')
    if (!usageDays.has(dk)) {
      logError('No usage for production', dk)
      outOfScopeDays += 1
      return
    }
    if (Number.isNaN(v) || v === 0) {
      logError('Invalid production value', k, v)
      return
    }
    average += v
    averageCount += 1
    truncatedProduction.set(k, v)
    if (!prodDays.has(dk)) {
      prodDays.set(dk, new Map())
    }
    prodDays.get(dk).set(k, v)
    if (!earliest || m < earliest) {
      earliest = m
    }
    if (!latest || m > latest) {
      latest = m
    }
  })
  prodDays.forEach((v, k) => {
    if (v.size >= 23) {
      complete.set(k, v)
    } else {
      partial.set(k, v)
    }
  })
  const valid = complete && complete.size === 365
  average /= averageCount
  return {
    average,
    prodDays,
    valid,
    earliest,
    latest,
    complete,
    partial,
    truncatedProduction,
    outOfScopeDays,
  }
}
