export default class ServiceResponse {
  [key: string]: any;

  constructor(values = {}) {
    Object.assign(this, values);
  }
}
