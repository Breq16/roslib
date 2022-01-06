import ServiceRequest from "./ServiceRequest.js";
import ServiceResponse from "./ServiceResponse.js";
import Ros from "./Ros.js";
import type { EventEmitter2 as EventEmitter2Type } from "eventemitter2";
import eventemitter2 from "eventemitter2";
const EventEmitter2 = eventemitter2.EventEmitter2;

type ServiceHandler = (
  message: ServiceRequest,
  response: ServiceResponse
) => boolean;

/**
 * A ROS service client.
 *
 * @constructor
 * @params options - possible keys include:
 *   * ros - the ROSLIB.Ros connection handle
 *   * name - the service name, like /add_two_ints
 *   * serviceType - the service type, like 'rospy_tutorials/AddTwoInts'
 */
class Service extends EventEmitter2 {
  ros: Ros;
  name: string;
  serviceType: string;
  isAdvertised = false;
  _serviceCallback: ServiceHandler = () => true;

  constructor(
    options: { ros?: Ros; name?: string; serviceType?: string } = {}
  ) {
    super();

    this.ros = options.ros;
    this.name = options.name;
    this.serviceType = options.serviceType;
  }

  callService(request: ServiceRequest = {}): Promise<any> {
    if (this.isAdvertised) {
      return;
    }

    const serviceCallId =
      "call_service:" + this.name + ":" + ++this.ros.idCounter;

    return new Promise((resolve, reject) => {
      this.ros.once(serviceCallId, (message) => {
        if (message.result === false) {
          reject(message.values);
        } else {
          resolve(message.values);
        }
      });

      this.ros.callOnConnection({
        op: "call_service",
        id: serviceCallId,
        service: this.name,
        type: this.serviceType,
        args: request,
      });
    });
  }

  /**
   * Advertise the service. This turns the Service object from a client
   * into a server. The callback will be called with every request
   * that's made on this service.
   *
   * @param callback - This works similarly to the callback for a C++ service and should take the following params:
   *   * request - the service request
   *   * response - an empty dictionary. Take care not to overwrite this. Instead, only modify the values within.
   *   It should return true if the service has finished successfully,
   *   i.e. without any fatal errors.
   */
  advertise(callback: ServiceHandler) {
    if (this.isAdvertised) {
      return;
    }

    this._serviceCallback = callback;

    this.ros.on(this.name, this._serviceResponse.bind(this));
    this.ros.callOnConnection({
      op: "advertise_service",
      type: this.serviceType,
      service: this.name,
    });

    this.isAdvertised = true;
  }

  unadvertise() {
    if (!this.isAdvertised) {
      return;
    }

    this.ros.callOnConnection({
      op: "unadvertise_service",
      service: this.name,
    });

    this.isAdvertised = false;
  }

  _serviceResponse(rosbridgeRequest: any) {
    const response = {};
    const success = this._serviceCallback(rosbridgeRequest.args, response);

    this.ros.callOnConnection({
      op: "service_response",
      service: this.name,
      values: new ServiceResponse(response),
      result: success,
      id: rosbridgeRequest.id || undefined,
    });
  }
}

export default Service;
