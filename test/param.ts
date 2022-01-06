import { expect } from "chai";
import * as ROSLIB from "../src/index.js";

describe("param", function () {
  this.timeout(1000);
  const ros = new ROSLIB.Ros({
    url: "ws://localhost:9090",
  });

  const param = ros.Param({
    name: "/rosapi/example",
  });

  it("should set param", (done) => {
    param.set("hello world").then(() => {
      done();
    });
  });

  it("should get param after set", (done) => {
    param.get().then((value) => {
      expect(value).to.equal("hello world");
      done();
    });
  });

  it("should delete param", (done) => {
    param.delete().then(() => {
      done();
    });
  });

  it("should get param after delete", (done) => {
    param.get().then((value) => {
      expect(value).to.be.null;
      done();
    });
  });

  this.afterAll(() => {
    ros.close();
  });
});
