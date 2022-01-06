export default class ServiceRequest {
  [key: string]: any;

  constructor(values = {}) {
    Object.assign(this, values);
  }
}
