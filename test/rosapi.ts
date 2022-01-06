import { expect } from "chai";
import * as ROSLIB from "../src/index.js";

describe("Rosbridge RosAPI", function () {
  this.timeout(1000);
  const ros = new ROSLIB.Ros({
    url: "ws://localhost:9090",
  });

  it("Returns the list of action servers", (done) => {
    ros.getActionServers().then((actionServers) => {
      expect(actionServers).to.be.eql([]);
      done();
    });
  });

  it("Returns the list of active topics", (done) => {
    ros
      .getTopics()
      .then((topics) => expect(topics.topics).to.contain.oneOf(["/rosout"]))
      .then(() => done())
      .catch(expect.fail);
  });

  it("Returns the topics for a specific type", (done) => {
    ros
      .getTopicsForType("rosgraph_msgs/Log")
      .then((topics) => expect(topics).to.contain.oneOf(["/rosout"]))
      .then(() => done())
      .catch(expect.fail);
  });

  it("Returns the list of services", (done) => {
    ros
      .getServices()
      .then((services) =>
        expect(services).to.contain.oneOf(["/rosapi/get_time"])
      )
      .then(() => done())
      .catch(expect.fail);
  });

  it("Returns services for type", (done) => {
    ros.getServicesForType("rosapi/GetTime").then((services) => {
      expect(services).to.contain.oneOf(["/rosapi/get_time"]);
      done();
    });
  });

  it("Returns service request details", (done) => {
    ros.getServiceRequestDetails("rosapi/GetParam").then((service) => {
      expect(service.typedefs[0].type).to.equal("rosapi/GetParamRequest");
      done();
    });
  });

  it("Returns service response details", (done) => {
    ros.getServiceResponseDetails("rosapi/GetParam").then((service) => {
      expect(service.typedefs[0].type).to.equal("rosapi/GetParamResponse");
      done();
    });
  });

  it("Returns the list of active nodes", (done) => {
    ros.getNodes().then((nodes) => {
      expect(nodes).to.contain.oneOf(["/rosout"]);
      done();
    });
  });

  it("Returns node details", (done) => {
    ros.getNodeDetails("/rosout").then((node) => {
      expect(node.subscribing).to.contain.oneOf(["/rosout"]);
      expect(node.publishing).to.contain.oneOf(["/rosout_agg"]);
      expect(node.services).to.contain.oneOf(["/rosout/get_loggers"]);
      done();
    });
  });

  it("Returns parameters", (done) => {
    ros.getParams().then((params) => {
      expect(params).to.contain.oneOf(["/rosapi/topics_glob"]);
      done();
    });
  });

  it("Returns the type of a topic", (done) => {
    ros.getTopicType("/rosout").then((type) => {
      expect(type).to.equal("rosgraph_msgs/Log");
      done();
    });
  });

  it("Returns the type of a service", (done) => {
    ros.getServiceType("/rosapi/get_time").then((type) => {
      expect(type).to.equal("rosapi/GetTime");
      done();
    });
  });

  it("Gets message details", (done) => {
    ros.getMessageDetails("std_msgs/Float64").then((typedefs) => {
      expect(typedefs[0].type).to.equal("std_msgs/Float64");
      done();
    });
  });

  it("Decodes type definitions", (done) => {
    ros.getMessageDetails("rosapi/TypeDef").then((typedefs) => {
      const decoded = ros.decodeTypeDefs(typedefs);
      expect(decoded.examples).to.contain("string");
      done();
    });
  });

  it("Decodes complex type definitions", (done) => {
    ros.getMessageDetails("sensor_msgs/MultiDOFJointState").then((typedefs) => {
      const decoded = ros.decodeTypeDefs(typedefs);
      expect(decoded.joint_names).to.contain("string");
      done();
    });
  });

  it("Returns topics and types", (done) => {
    ros.getTopicsAndRawTypes().then(({ topics, types, typedefs_full_text }) => {
      expect(topics).to.contain.oneOf(["/rosout"]);
      expect(types).to.contain.oneOf(["rosgraph_msgs/Log"]);
      expect(typedefs_full_text).to.not.be.empty;
      done();
    });
  });

  this.afterAll(() => {
    ros.close();
  });
});
