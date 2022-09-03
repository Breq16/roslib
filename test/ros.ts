import { expect } from "chai";
import EventEmitter2 from "eventemitter2";
import * as ROSLIB from "../src/index.js";

describe("ROS Object", () => {
  it("should accept more than EventEmitter2's default listeners", () => {
    // By default, EventEmitter2 only accepts 10 listeners. When more than
    // the default, a 'warn' property is set on the listener. The first part
    // of this test proves the 'warn' property will be set with default
    // EventEmitter2 settings.
    const callCount = 50;
    const eventEmitter = new EventEmitter2();
    for (let i = 0; i < callCount; i++) {
      eventEmitter.on("foo", function () {});
    }
    expect((eventEmitter as any)._events["foo"]).to.have.length(callCount);
    expect((eventEmitter as any)._events["foo"]).to.have.property("warned");

    // The next part of this test shows that the 'warn' property is not set
    // for Ros, even with the same number of listeners as above.
    const ros = new ROSLIB.Ros();
    for (let i = 0; i < callCount; i++) {
      ros.callOnConnection({});
    }
    expect((ros as any)._events["connection"]).to.have.length(callCount);
    expect((ros as any)._events["connection"]).to.not.have.property("warned");
  });

  it("sends auth messages", (done) => {
    const ros = new ROSLIB.Ros({
      url: "ws://localhost:9090",
    });

    let dest = "0.0.0.0";
    let rand = "im so random! rawr xD";
    let time = new Date().getTime() / 1000;
    let timeEnd = time + 1000;
    let level = "admin";
    let mac = "THISISASHA512HASHIPROMISE";
    ros.authenticate(mac, "0.0.0.0", dest, rand, time, level, timeEnd);

    setTimeout(() => {
      ros.close();
      done();
    }, 100);
  });

  it("throws for invalid transport libraries", () => {
    expect(() => {
      const ros = new ROSLIB.Ros({
        transportLibrary: "invalid",
      });

      ros.connect("ws://localhost:9090");
    }).to.throw();
  });

  it("sets the status level", (done) => {
    const ros = new ROSLIB.Ros({
      url: "ws://localhost:9090",
    });

    ros.setStatusLevel("error");

    setTimeout(() => {
      ros.close();
      done();
    }, 50);
  });
});
