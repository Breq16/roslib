/**
 * Socket event handling utilities for handling events on either
 * WebSocket and TCP sockets
 */

import decompressPng from "../util/decompressPng.js";
import CBOR from "cbor-js";
import typedArrayTagger from "../util/cborTypedArrayTags.js";
import Ros from "./Ros.js";

class SocketAdapter {
  client: Ros;
  decoder: any;

  constructor(client: Ros) {
    this.client = client;

    if (client.options.transportOptions.decoder) {
      this.decoder = client.options.transportOptions.decoder;
    }
  }

  handleMessage(message: any) {
    if (message.op === "publish") {
      this.client.emit(message.topic, message.msg);
    } else if (message.op === "service_response") {
      this.client.emit(message.id, message);
    } else if (message.op === "call_service") {
      this.client.emit(message.service, message);
    } else if (message.op === "status") {
      if (message.id) {
        this.client.emit("status: " + message.id, message);
      } else {
        this.client.emit("status", message);
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

  onopen(event: any) {
    this.client.isConnected = true;
    this.client.emit("connection", event);
  }

  onclose(event: any) {
    this.client.isConnected = false;
    this.client.emit("close", event);
  }

  onerror(event: any) {
    this.client.emit("error", event);
  }

  async onmessage(data: any) {
    try {
      if (this.decoder) {
        const message = await this.decoder(data);
        this.handleMessage(message);
      } else if (globalThis.Blob && data.data instanceof Blob) {
        const message = await this.decodeBSON(data.data);
        const decoded = await this.handlePng(message);
        this.handleMessage(decoded);
      } else if (data.data instanceof ArrayBuffer) {
        const message = CBOR.decode(data.data, typedArrayTagger);
        this.handleMessage(message);
      } else {
        const message = JSON.parse(typeof data === "string" ? data : data.data);
        const decoded = await this.handlePng(message);
        this.handleMessage(decoded);
      }
    } catch (e) {
      console.error("Error while parsing socket message:", e);
    }
  }

  static adapt(client: Ros) {
    const adapter = new SocketAdapter(client);

    return {
      onopen: adapter.onopen.bind(adapter),
      onclose: adapter.onclose.bind(adapter),
      onerror: adapter.onerror.bind(adapter),
      onmessage: adapter.onmessage.bind(adapter),
    };
  }
}

export default SocketAdapter;
