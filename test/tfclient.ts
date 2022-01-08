import { expect } from "chai";
import { TFClient } from "../src/index.js";

describe("TFClient", function () {
  describe("dispose", function () {
    it("should not subscribe to republished topic if already disposed", function () {
      // This test makes sure we do not subscribe to the republished topic if the
      // tf client has already been disposed when we get the response (from the setup request)
      // from the server.

      var dummyROS = {
        idCounter: 0,
        on: () => {},
        off: () => {},
        callOnConnection: () => {},
      };

      var tfclient = new TFClient({ ros: dummyROS });
      tfclient.dispose();

      // Simulated a response from the server after the client is already disposed
      tfclient.processResponse({ topic_name: "/repub_1" });

      expect(tfclient.currentTopic).to.be.false;
    });
  });
});
