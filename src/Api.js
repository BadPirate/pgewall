const serverBase = window.location.protocol+'//'+ window.location.hostname+':5000';

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