const serverBase = window.location.protocol+'//'+ window.location.hostname+':5000';

function API(cmd) {
  let call = `${serverBase}/api/${cmd}`;
  return fetch(call)
         .then(response => response.json());
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

  api(cmd) {
    if (!this.userID) throw new Error("User ID not set before making Enphase API call");
    return API(`enphase/${cmd}?user_id=${this.userID}`);
  }
}