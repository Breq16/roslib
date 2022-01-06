import { expect } from "chai";
import * as ROSLIB from "../../src/index.js";

describe("Transform", () => {
  describe("creation", () => {
    it("should return an object of the correct type", () => {
      const t = new ROSLIB.Transform();
      expect(t.constructor.name).to.equal("Transform");
    });

    it("should contain a valid vector and quaternion", () => {
      const t = new ROSLIB.Transform({
        translation: { x: 1, y: 2, z: 3 },
        rotation: { x: 0.9, y: 0.8, z: 0.7, w: 1 },
      });
      expect(t.translation.constructor.name).to.equal("Vector3");
      expect(t.translation.x).to.equal(1);
      expect(t.rotation.constructor.name).to.equal("Quaternion");
      expect(t.rotation.z).to.equal(0.7);
      expect(t.rotation.w).to.equal(1);
    });
  });

  it("should properly clone itself", () => {
    const t = new ROSLIB.Transform({
      translation: { x: 1, y: 2, z: 3 },
      rotation: { x: 0.9, y: 0.8, z: 0.7, w: 1 },
    });

    const t2 = t.clone();

    expect(t).not.equal(t2);
    expect(t).eql(t2);
  });
});
