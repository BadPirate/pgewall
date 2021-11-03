import API from './Api'

export default class PVWattsAPI {
  /**
   * @param {number} capacity in kWh
   * @param {0|1|2} type solar cell type Standard, Premium, Thin Film
   * @param {number} losses as a percentage
   * @param {string} address where panels will be located
   */
  static hourlySimulation(capacity, type, losses, tilt, address) {
    if (!capacity || Number.isNaN(capacity)) {
      return Promise.reject(Error('Capacity must be set'))
    }
    if (!address || address.length === 0) {
      return Promise.reject(Error('Address must be set'))
    }
    return this
      .api(`hourly/${capacity}/${type}/${losses}/${tilt}/${encodeURIComponent(address)}`)
      .then((result) => result.map((wh) => wh / 1000))
  }

  static api(cmd) {
    return API(`nrel/pvwatts/${cmd}`)
  }
}
