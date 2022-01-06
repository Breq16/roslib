import Ros from "./Ros.js";
import Service from "./Service.js";
import ServiceRequest from "./ServiceRequest.js";

class Param {
  ros: Ros;
  name: string;

  constructor(options: { ros?: Ros; name?: string } = {}) {
    this.ros = options.ros;
    this.name = options.name;
  }

  get() {
    const paramClient = new Service({
      ros: this.ros,
      name: "/rosapi/get_param",
      serviceType: "rosapi/GetParam",
    });
    const request = new ServiceRequest({
      name: this.name,
    });

    return paramClient
      .callService(request)
      .then((result: any) => JSON.parse(result.value));
  }

  set(value: any) {
    const paramClient = new Service({
      ros: this.ros,
      name: "/rosapi/set_param",
      serviceType: "rosapi/SetParam",
    });
    const request = new ServiceRequest({
      name: this.name,
      value: JSON.stringify(value),
    });

    return paramClient.callService(request);
  }

  delete() {
    const paramClient = new Service({
      ros: this.ros,
      name: "/rosapi/delete_param",
      serviceType: "rosapi/DeleteParam",
    });
    const request = new ServiceRequest({
      name: this.name,
    });

    return paramClient.callService(request);
  }
}

export default Param;
