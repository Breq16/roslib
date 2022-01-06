import { expect } from "chai";
import * as ROSLIB from "../src/index.js";

describe("ROS Services", function () {
  this.timeout(1000);

  const ros = new ROSLIB.Ros({
    url: "ws://localhost:9090",
  });

  const remoteService = ros.Service({
    name: "/rosapi/get_time",
    serviceType: "rosapi/GetTime",
  });

  const localService = ros.Service({
    name: "/websocket/example_service",
    serviceType: "std_srvs/SetBool",
  });

  const localRequester = ros.Service({
    name: "/websocket/example_service",
    serviceType: "std_srvs/SetBool",
  });

  it("Sends a request to a remote service", () => {
    return remoteService.callService().then((response) => {
      expect(response.time.secs).to.be.a("number");
    });
  });

  it("Advertises a local service", () => {
    localService.advertise((request, response) => {
      response.success = !request.data;
      response.message = "Hello, world!";

      return true;
    });
  });

  it("Allows calling that local service", async () => {
    const response = await localRequester.callService({ data: true });
    expect(response.success).to.be.false;
    expect(response.message).to.equal("Hello, world!");
  });

  it("Does nothing when attempting to call a service it advertises", () => {
    const promise = localService.callService({ data: true });

    expect(promise).to.be.undefined;
  });

  it("Does nothing when attempting to re-advertise a service", (done) => {
    localService.advertise(() => true);

    localRequester.callService({ data: true }).then((response) => {
      expect(response.message).to.equal("Hello, world!");
      done();
    });
  });

  it("Allows unadvertising a local service", (done) => {
    localService.unadvertise();

    setTimeout(done, 50);
  });

  it("Fails to call that service after unadvertising it", (done) => {
    localRequester
      .callService({ data: true })
      .then(() => expect.fail())
      .catch(() => {});

    setTimeout(done, 200);
  });

  it("Does nothing when re-un-advertising", () => {
    localService.unadvertise();
  });

  this.afterAll(() => {
    ros.close();
  });
});
