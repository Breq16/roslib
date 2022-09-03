import Message from "./Message.js";
import Ros from "./Ros.js";
import EventEmitter2 from "eventemitter2";

interface TopicOptions {
  ros: Ros;
  name: string;
  messageType: string;
  compression: "png" | "cbor" | "cbor-raw" | "none";
  throttle_rate: number;
  queue_size: number;
  latch: boolean;
  queue_length: number;
  reconnect_on_close: boolean;
}

const defaultOptions = {
  compression: "none",
  throttle_rate: 0,
  latch: false,
  queue_size: 100,
  queue_length: 0,
  reconnect_on_close: true,
};

/**
 * Publish and/or subscribe to a topic in ROS.
 *
 * Emits the following events:
 *  * 'warning' - if there are any warning during the Topic creation
 *  * 'message' - the message data from rosbridge
 *
 * @constructor
 * @param options - object with following keys:
 *   * ros - the ROSLIB.Ros connection handle
 *   * name - the topic name, like /cmd_vel
 *   * messageType - the message type, like 'std_msgs/String'
 *   * compression - the type of compression to use, like 'png', 'cbor', or 'cbor-raw'
 *   * throttle_rate - the rate (in ms in between messages) at which to throttle the topics
 *   * queue_size - the queue created at bridge side for re-publishing webtopics (defaults to 100)
 *   * latch - latch the topic when publishing
 *   * queue_length - the queue length at bridge side used when subscribing (defaults to 0, no queueing).
 *   * reconnect_on_close - the flag to enable resubscription and readvertisement on close event(defaults to true).
 */

class Topic extends EventEmitter2 {
  options: TopicOptions;
  ros: Ros;
  isAdvertised = false;
  waitForReconnect = false;
  subscribeId?: string;
  advertiseId?: string;
  callForSubscribeAndAdvertise: (message: any) => void;
  reconnectFunc: () => void;
  _messageCallback: (message: any) => void;

  constructor(options: Partial<TopicOptions>) {
    super();

    if (!options.ros || !options.name || !options.messageType) {
      throw new Error("'ros' is required for Topic");
    }

    this.options = { ...defaultOptions, ...options } as TopicOptions;
    this.ros = this.options.ros;

    if (this.options.throttle_rate < 0) {
      this.options.throttle_rate = 0;
    }

    if (this.options.reconnect_on_close) {
      this.callForSubscribeAndAdvertise = (message) => {
        this.ros.callOnConnection(message);

        this.waitForReconnect = false;
        this.reconnectFunc = () => {
          if (!this.waitForReconnect) {
            this.waitForReconnect = true;
            this.ros.callOnConnection(message);
            this.ros.once("connection", () => {
              this.waitForReconnect = false;
            });
          }
        };
        this.ros.on("close", this.reconnectFunc);
      };
    } else {
      this.callForSubscribeAndAdvertise = this.ros.callOnConnection.bind(
        this.ros
      );
    }

    this._messageCallback = (data: any) => {
      this.emit("message", new Message(data));
    };
  }

  subscribe(callback: (message: any) => void) {
    this.on("message", callback);

    if (this.subscribeId) {
      return;
    }

    this.ros.on(this.options.name, this._messageCallback);
    this.subscribeId =
      "subscribe:" + this.options.name + ":" + ++this.ros.idCounter;

    this.callForSubscribeAndAdvertise({
      op: "subscribe",
      id: this.subscribeId,
      type: this.options.messageType,
      topic: this.options.name,
      compression: this.options.compression,
      throttle_rate: this.options.throttle_rate,
      queue_length: this.options.queue_length,
    });
  }

  unsubscribe(callback?: (message: any) => void) {
    if (callback) {
      this.off("message", callback);
    }

    if (!this.subscribeId) {
      return;
    }

    if (!callback || this.listeners("message").length === 0) {
      // If no callback is passed, unsubscribe unconditionally.
      // Otherwise, only unsubscribe from the topic only if we have no more listeners.
      this.ros.off(this.options.name, this._messageCallback);

      if (this.options.reconnect_on_close) {
        this.ros.off("close", this.reconnectFunc);
      }

      this.emit("unsubscribe");

      this.ros.callOnConnection({
        op: "unsubscribe",
        id: this.subscribeId,
        topic: this.options.name,
      });
      this.subscribeId = null;
    }
  }

  advertise() {
    if (this.isAdvertised) {
      return;
    }

    this.advertiseId =
      "advertise:" + this.options.name + ":" + ++this.ros.idCounter;

    this.callForSubscribeAndAdvertise({
      op: "advertise",
      id: this.advertiseId,
      type: this.options.messageType,
      topic: this.options.name,
      latch: this.options.latch,
      queue_size: this.options.queue_size,
    });

    this.isAdvertised = true;

    if (!this.options.reconnect_on_close) {
      this.ros.on("close", () => {
        this.isAdvertised = false;
      });
    }
  }

  unadvertise() {
    if (!this.isAdvertised) {
      return;
    }

    if (this.options.reconnect_on_close) {
      this.ros.off("close", this.reconnectFunc);
    }

    this.emit("unadvertise");

    this.ros.callOnConnection({
      op: "unadvertise",
      id: this.advertiseId,
      topic: this.options.name,
    });

    this.isAdvertised = false;
  }

  publish(message: any) {
    if (!this.isAdvertised) {
      this.advertise();
    }

    this.ros.callOnConnection({
      op: "publish",
      id: "publish:" + this.options.name + ":" + ++this.ros.idCounter,
      topic: this.options.name,
      msg: message,
      latch: this.options.latch,
    });
  }
}

export default Topic;
