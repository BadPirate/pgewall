const serverBase = (process.env.NODE_ENV === "development") ? window.location.protocol+'//'+ window.location.hostname+':5000' : '';

function API(cmd) {
  let call = `${serverBase}/api/${cmd}`;
  return fetch(call)
         .then(response => {
           console.log(response);
           return response.json();
         })
}

export class EnphaseAPI
{
  system = '';
  systems = '';

  constructor(userID) {
    this.userID = userID;
  }

  getSystems() {
    if (this.systems) {
      return new Promise(resolve => { resolve(this.systems) });
    }
    return this.api('systems')
  }

  getProduction(systemID, start, end) {
    return this.api(`${systemID}/production/${start}/${end}`);
  }

  api(cmd) {
    if (!this.userID) throw new Error("User ID not set before making Enphase API call");
    return API(`enlighten/${this.userID}/${cmd}`);
  }
}

export class PVWattsAPI
{
  /**
   * @param {number} capacity in kWh
   * @param {0|1|2} type solar cell type Standard, Premium, Thin Film
   * @param {number} losses as a percentage
   * @param {string} address where panels will be located
   */
  hourlySimulation(capacity,type,losses,tilt,address)
  {
    return this.api(`hourly/${capacity}/${type}/${losses}/${tilt}/${encodeURIComponent(address)}`);
  }

  api(cmd) {
    return API(`nrel/pvwatts/${cmd}`);
  }
}