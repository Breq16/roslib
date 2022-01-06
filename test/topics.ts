import { expect } from "chai";
import * as ROSLIB from "../src/index.js";

describe("Topics", function () {
  this.timeout(1000);
  const ros = new ROSLIB.Ros({
    url: "ws://localhost:9090",
  });

  const topic1 = ros.Topic({
    name: "/websocket/example_topic",
    messageType: "std_msgs/String",
  });

  function format(msg) {
    return { data: msg };
  }
  const messages1 = ["Hello Example2!", "Whats good?"].map(format);
  const messages2 = ["Hi there", "this example working"].map(format);

  const topic2 = ros.Topic({
    name: "/websocket/example_topic",
    messageType: "std_msgs/String",
  });

  it("Allows simultaneous subscribing and publishing", (done) => {
    let topic1msg = messages1[0];
    let topic2msg: { data?: string } = {};

    topic1.subscribe((message) => {
      if (message.data === topic1msg.data) return;
      topic1msg = messages1[0];
      expect(message).to.be.eql(messages2.shift());
      if (messages1.length) topic1.publish(topic1msg);
      else done();
    });

    topic2.subscribe((message) => {
      if (message.data === topic2msg.data) return;
      topic2msg = messages2[0];
      expect(message).to.be.eql(messages1.shift());
      if (messages2.length) topic2.publish(topic2msg);
      else done();
    });
    topic1.publish(topic1msg);
  });

  it("Handles unsubscribe without affecting other topics", (done) => {
    topic2.subscribe((message) => {
      expect.fail();
    });
    topic1.unsubscribe();
    topic2.removeAllListeners("message");
    topic2.subscribe((message) => {
      expect(message).to.be.eql({
        data: "hi",
      });
      done();
    });
    topic1.publish({
      data: "hi",
    });
  });

  it("Handles unadvertise without affecting other topics", (done) => {
    topic1.unsubscribe();
    topic2.unadvertise();
    topic2.removeAllListeners("message");
    topic2.subscribe((message) => {
      expect(topic2.isAdvertised).to.be.false;
      expect(message).to.be.eql({
        data: "hi2",
      });
      done();
    });
    topic1.publish({
      data: "hi2",
    });
  });

  it("Handles unsubscribing from all topics", (done) => {
    topic1.unsubscribe();
    topic2.unsubscribe();
    ros.on("/example_topic", () => {
      expect.fail();
    });
    topic1.publish({
      data: "sup",
    });
    setTimeout(done, 50);
  });

  const multi_sub = ros.Topic({
    name: "/websocket/example_topic_multiple_subscribe",
    messageType: "std_msgs/String",
  });

  const multi_pub = ros.Topic({
    name: "/websocket/example_topic_multiple_subscribe",
    messageType: "std_msgs/String",
  });

  it("Allows unsubscribing and subscribing specific callbacks", (done) => {
    const cb1 = (message) => {
      expect(message).to.be.eql({
        data: "hi4",
      });
      setTimeout(done, 100);
      multi_sub.unsubscribe(cb1);
    };

    const cb2 = (message) => {
      expect.fail();
    };

    multi_sub.subscribe(cb1);
    multi_sub.subscribe(cb2);

    multi_sub.unsubscribe(cb2);

    setTimeout(() => {
      multi_pub.publish({
        data: "hi4",
      });
    }, 50);
  });

  it("Does nothing when attempting to re-advertise", () => {
    multi_pub.advertise();
  });

  const reconnect = ros.Topic({
    name: "/websocket/example_topic_reconnect",
    messageType: "std_msgs/String",
  });

  const reconnect_pub = ros.Topic({
    name: "/websocket/example_topic_reconnect",
    messageType: "std_msgs/String",
  });

  it("Reconnects on close", (done) => {
    reconnect.subscribe((message) => {
      expect(message).to.be.eql({
        data: "hi5",
      });
      done();
      reconnect.unsubscribe();
    });

    reconnect_pub.advertise();

    ros.close();
    setTimeout(() => ros.connect("ws://localhost:9090"), 50);

    setTimeout(() => {
      reconnect_pub.publish({
        data: "hi5",
      });
    }, 200);
  });

  const no_reconnect = ros.Topic({
    name: "/websocket/example_topic_no_reconnect",
    messageType: "std_msgs/String",
    reconnect_on_close: false,
  });

  const no_reconnect_pub = ros.Topic({
    name: "/websocket/example_topic_no_reconnect",
    messageType: "std_msgs/String",
  });

  it("Does not reconnect when option is set", (done) => {
    no_reconnect.subscribe((message) => {
      expect.fail();
    });

    ros.close();
    setTimeout(() => ros.connect("ws://localhost:9090"), 10);

    setTimeout(() => {
      no_reconnect_pub.publish({
        data: "hi3",
      });
    }, 50);

    setTimeout(done, 100);
  });

  it("closes properly, unadvertising even when not explicitly called", () => {
    topic1.unadvertise();
    topic1.unsubscribe();
    // topic2.unadvertise();
    // topic2.unsubscribe();

    ros.close();
  });

  it("allows re-un-advertise", () => {
    topic1.unadvertise();
  });

  it("Does not allow creating a topic without message", () => {
    expect(() => {
      ros.Topic({
        name: "/websocket/example_topic",
      });
    }).to.throw();
  });

  it("Corrects subzero throttle rates", () => {
    const topic = ros.Topic({
      name: "/websocket/example_topic",
      messageType: "std_msgs/String",
      throttle_rate: -1,
    });
    expect(topic.options.throttle_rate).to.equal(0);
  });
});
