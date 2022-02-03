import WebSocket from "isomorphic-ws";
import WorkerSocket from "workersocket";

import decompressPng from "../util/decompressPng.js";
import CBOR from "cbor-js";
import typedArrayTagger from "../util/cborTypedArrayTags.js";

import Topic from "./Topic.js";
import Service from "./Service.js";
import ServiceRequest from "./ServiceRequest.js";
import Param from "./Param.js";

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
  transportLibrary: "workersocket",
  transportOptions: {},
};

class Ros extends EventEmitter2 {
  options: RosOptions;

  socket: WorkerSocket;
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

  handleDecodedMessage(message: any) {
    if (message.op === "publish") {
      this.emit(message.topic, message.msg);
    } else if (message.op === "service_response") {
      this.emit(message.id, message);
    } else if (message.op === "call_service") {
      this.emit(message.service, message);
    } else if (message.op === "status") {
      if (message.id) {
        this.emit("status: " + message.id, message);
      } else {
        this.emit("status", message);
      }
    }
  }

  handlePng(message: any): Promise<any> {
    if (message.op === "png") {
      return decompressPng(message.data);
    } else {
      return message;
    }
  }

  decodeBSON(data: Blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const uint8array = new Uint8Array(event.target.result as ArrayBuffer);
        const BSON = await import("bson");
        const result = BSON.deserialize(uint8array);
        resolve(result);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsArrayBuffer(data);
    });
  }

  async handleMessage(data: any) {
    try {
      if (this.options.transportOptions.decoder) {
        const message = await this.options.transportOptions.decoder(data);
        this.handleDecodedMessage(message);
      } else if (globalThis.Blob && data.data instanceof Blob) {
        const message = await this.decodeBSON(data.data);
        const decoded = await this.handlePng(message);
        this.handleDecodedMessage(decoded);
      } else if (data.data instanceof ArrayBuffer) {
        const message = CBOR.decode(data.data, typedArrayTagger);
        this.handleDecodedMessage(message);
      } else {
        const message = JSON.parse(typeof data === "string" ? data : data.data);
        const decoded = await this.handlePng(message);
        this.handleDecodedMessage(decoded);
      }
    } catch (e) {
      console.error("Error while parsing socket message:", e);
    }
  }

  connect(url: string) {
    const tl = this.options.transportLibrary;
    if (tl === "websocket" || tl === "workersocket") {
      if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
        if (tl === "websocket") {
          this.socket = new WebSocket(url);
        } else if (tl === "workersocket") {
          this.socket = new WorkerSocket(url);
        }

        this.socket.binaryType = "arraybuffer";

        this.socket.onopen = () => {
          this.isConnected = true;
          this.emit("connection");
        };
        this.socket.onclose = () => {
          this.isConnected = false;
          this.emit("close");
        };
        this.socket.onerror = (event: Event) => {
          this.emit("error", event);
        };
        this.socket.onmessage = (event: Event) => {
          this.handleMessage(event);
        };
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
