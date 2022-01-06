import WebSocket from "isomorphic-ws";
import SocketAdapter from "./SocketAdapter.js";

import Topic from "./Topic.js";
import Service from "./Service.js";
import ServiceRequest from "./ServiceRequest.js";
import Param from "./Param.js";

import type { EventEmitter2 as EventEmitter2Type } from "eventemitter2";
import eventemitter2 from "eventemitter2";
const EventEmitter2 = eventemitter2.EventEmitter2;

interface RosOptions {
  url?: string;
  groovyCompatibility: boolean;
  transportLibrary: string;
  transportOptions: any;
}

const defaultOptions = {
  groovyCompatibility: true,
  transportLibrary: "websocket",
  transportOptions: {},
};

class Ros extends EventEmitter2 {
  options: RosOptions;

  socket: WebSocket;
  idCounter = 0;
  isConnected = false;

  constructor(options: Partial<RosOptions> = {}) {
    super();

    this.options = { ...defaultOptions, ...options };

    this.setMaxListeners(0);

    if (this.options.url) {
      this.connect(this.options.url);
    }
  }

  connect(url: string) {
    if (this.options.transportLibrary === "websocket") {
      if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
        const sock = new WebSocket(url);
        sock.binaryType = "arraybuffer";
        this.socket = Object.assign(sock, SocketAdapter.adapt(this));
      }
    } else {
      throw (
        "Unknown transportLibrary: " + this.options.transportLibrary.toString()
      );
    }
  }

  close() {
    if (this.socket) {
      this.socket.close();
    }
  }
  /**
   * Sends an authorization request to the server.
   *
   * @param mac - MAC (hash) string given by the trusted source.
   * @param client - IP of the client.
   * @param dest - IP of the destination.
   * @param rand - Random string given by the trusted source.
   * @param t - Time of the authorization request.
   * @param level - User level as a string given by the client.
   * @param end - End time of the client's session.
   */
  authenticate(
    mac: string,
    client: string,
    dest: string,
    rand: string,
    t: number,
    level: string,
    end: number
  ) {
    this.callOnConnection({
      op: "auth",
      mac: mac,
      client: client,
      dest: dest,
      rand: rand,
      t: t,
      level: level,
      end: end,
    });
  }

  sendEncodedMessage(messageEncoded: string) {
    if (!this.isConnected) {
      this.once("connection", () => {
        this.socket.send(messageEncoded);
      });
    } else {
      this.socket.send(messageEncoded);
    }
  }

  callOnConnection(message: any) {
    this.sendEncodedMessage(JSON.stringify(message));
  }

  /**
   * Sends a set_level request to the server
   *
   * @param level - Status level (none, error, warning, info)
   * @param id - Optional: Operation ID to change status level on
   */
  setStatusLevel(level: string, id?: string) {
    const levelMessage = {
      op: "set_level",
      level: level,
      id: id,
    };

    this.callOnConnection(levelMessage);
  }

  getActionServers(): Promise<any[]> {
    const getActionServers = new Service({
      ros: this,
      name: "/rosapi/action_servers",
      serviceType: "rosapi/GetActionServers",
    });
    const request = new ServiceRequest({});

    return getActionServers
      .callService(request)
      .then((result: any) => result.action_servers);
  }

  getTopics() {
    const topicsClient = new Service({
      ros: this,
      name: "/rosapi/topics",
      serviceType: "rosapi/Topics",
    });
    const request = new ServiceRequest({});

    return topicsClient.callService(request) as Promise<{
      topics: string[];
      types: string[];
    }>;
  }

  getTopicsForType(type: string): Promise<any[]> {
    const topicsForTypeClient = new Service({
      ros: this,
      name: "/rosapi/topics_for_type",
      serviceType: "rosapi/TopicsForType",
    });
    const request = new ServiceRequest({
      type,
    });

    return topicsForTypeClient
      .callService(request)
      .then((result: any) => result.topics) as Promise<any[]>;
  }

  getServices(): Promise<any[]> {
    const servicesClient = new Service({
      ros: this,
      name: "/rosapi/services",
      serviceType: "rosapi/Services",
    });
    const request = new ServiceRequest({});

    return servicesClient
      .callService(request)
      .then((result: any) => result.services) as Promise<any[]>;
  }

  getServicesForType(type: string): Promise<any[]> {
    const servicesForTypeClient = new Service({
      ros: this,
      name: "/rosapi/services_for_type",
      serviceType: "rosapi/ServicesForType",
    });
    const request = new ServiceRequest({
      type,
    });

    return servicesForTypeClient
      .callService(request)
      .then((result: any) => result.services) as Promise<any[]>;
  }

  getServiceRequestDetails(type: string): Promise<any> {
    const serviceTypeClient = new Service({
      ros: this,
      name: "/rosapi/service_request_details",
      serviceType: "rosapi/ServiceRequestDetails",
    });
    const request = new ServiceRequest({
      type,
    });

    return serviceTypeClient.callService(request);
  }

  getServiceResponseDetails(type: string): Promise<any> {
    const serviceTypeClient = new Service({
      ros: this,
      name: "/rosapi/service_response_details",
      serviceType: "rosapi/ServiceResponseDetails",
    });
    const request = new ServiceRequest({
      type,
    });

    return serviceTypeClient.callService(request);
  }

  getNodes(): Promise<any[]> {
    const nodesClient = new Service({
      ros: this,
      name: "/rosapi/nodes",
      serviceType: "rosapi/Nodes",
    });
    const request = new ServiceRequest({});

    return nodesClient.callService(request).then((result: any) => result.nodes);
  }

  getNodeDetails(node: string) {
    const nodeDetailsClient = new Service({
      ros: this,
      name: "/rosapi/node_details",
      serviceType: "rosapi/NodeDetails",
    });
    const request = new ServiceRequest({
      node,
    });

    return nodeDetailsClient
      .callService(request)
      .then(
        ({
          subscribing,
          publishing,
          services,
        }: {
          subscribing: string[];
          publishing: string[];
          services: string[];
        }) => ({
          subscribing,
          publishing,
          services,
        })
      );
  }

  getParams(): Promise<any[]> {
    const paramsClient = new Service({
      ros: this,
      name: "/rosapi/get_param_names",
      serviceType: "rosapi/GetParamNames",
    });
    const request = new ServiceRequest({});

    return paramsClient
      .callService(request)
      .then((result: any) => result.names);
  }

  getTopicType(topic: string) {
    const topicTypeClient = new Service({
      ros: this,
      name: "/rosapi/topic_type",
      serviceType: "rosapi/TopicType",
    });
    const request = new ServiceRequest({
      topic,
    });

    return topicTypeClient
      .callService(request)
      .then((result: any) => result.type);
  }

  getServiceType(service: string) {
    const serviceTypeClient = new Service({
      ros: this,
      name: "/rosapi/service_type",
      serviceType: "rosapi/ServiceType",
    });
    const request = new ServiceRequest({
      service,
    });

    return serviceTypeClient
      .callService(request)
      .then((result: any) => result.type);
  }

  getMessageDetails(type: string) {
    const messageDetailsClient = new Service({
      ros: this,
      name: "/rosapi/message_details",
      serviceType: "rosapi/MessageDetails",
    });
    const request = new ServiceRequest({
      type,
    });

    return messageDetailsClient
      .callService(request)
      .then((result: any) => result.typedefs);
  }

  decodeTypeDefs(defs: any) {
    const decodeRecursive = (type, hints) => {
      const typeDefDict: any = {};
      for (let i = 0; i < type.fieldnames.length; i++) {
        const arrayLen = type.fieldarraylen[i];
        const fieldName = type.fieldnames[i];
        const fieldType = type.fieldtypes[i];
        if (fieldType.indexOf("/") === -1) {
          // check the fieldType includes '/' or not
          if (arrayLen === -1) {
            typeDefDict[fieldName] = fieldType;
          } else {
            typeDefDict[fieldName] = [fieldType];
          }
        } else {
          // lookup the name
          let sub = false;
          for (let j = 0; j < hints.length; j++) {
            if (hints[j].type.toString() === fieldType.toString()) {
              sub = hints[j];
              break;
            }
          }
          if (sub) {
            const subResult = decodeRecursive(sub, hints);
            if (arrayLen === -1) {
            } else {
              typeDefDict[fieldName] = [subResult];
            }
          } else {
            this.emit(
              "error",
              "Cannot find " + fieldType + " in decodeTypeDefs"
            );
          }
        }
      }
      return typeDefDict;
    };

    return decodeRecursive(defs[0], defs);
  }

  getTopicsAndRawTypes(): Promise<any> {
    const topicsAndRawTypesClient = new Service({
      ros: this,
      name: "/rosapi/topics_and_raw_types",
      serviceType: "rosapi/TopicsAndRawTypes",
    });
    const request = new ServiceRequest({});

    return topicsAndRawTypesClient.callService(request);
  }

  Topic(options: any) {
    return new Topic({
      ros: this,
      ...options,
    });
  }

  Service(options: any) {
    return new Service({
      ros: this,
      ...options,
    });
  }

  Param(options: any) {
    return new Param({
      ros: this,
      ...options,
    });
  }
}

export default Ros;
