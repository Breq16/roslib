import { expect } from "chai";
import * as ROSLIB from "../../src/index.js";

describe("Quaternion", () => {
  describe("creation", () => {
    it("should return an object of the correct type", () => {
      const q = new ROSLIB.Quaternion();
      expect(q.constructor.name).to.equal("Quaternion");
    });

    it("should return an identity quaternion when no params are specified", () => {
      const q = new ROSLIB.Quaternion();
      expect(q.x).to.equal(0);
      expect(q.y).to.equal(0);
      expect(q.z).to.equal(0);
      expect(q.w).to.equal(1);
    });

    it("should return an identity quaternion when null is specified", () => {
      const q = new ROSLIB.Quaternion({ x: null, y: null, z: null, w: null });
      expect(q.x).to.equal(0);
      expect(q.y).to.equal(0);
      expect(q.z).to.equal(0);
      expect(q.w).to.equal(1);
    });

    it("should return a quaternion matching the options hash", () => {
      const q = new ROSLIB.Quaternion({ x: 1.1, y: 2.2, z: 3.3, w: 4.4 });
      expect(q.x).to.equal(1.1);
      expect(q.y).to.equal(2.2);
      expect(q.z).to.equal(3.3);
      expect(q.w).to.equal(4.4);
    });

    it("should return a quaternion matching the options", () => {
      let q = new ROSLIB.Quaternion({ x: 1, y: 0, z: 0, w: 0 });
      expect(q.x).to.equal(1);
      expect(q.y).to.equal(0);
      expect(q.z).to.equal(0);
      expect(q.w).to.equal(0);

      q = new ROSLIB.Quaternion({ x: 0, y: 1, z: 0, w: 0 });
      expect(q.x).to.equal(0);
      expect(q.y).to.equal(1);
      expect(q.z).to.equal(0);
      expect(q.w).to.equal(0);

      q = new ROSLIB.Quaternion({ x: 0, y: 0, z: 1, w: 0 });
      expect(q.x).to.equal(0);
      expect(q.y).to.equal(0);
      expect(q.z).to.equal(1);
      expect(q.w).to.equal(0);
    });
  });

  describe("conjugation", () => {
    it("should conjugate itself", () => {
      const q = new ROSLIB.Quaternion({ x: 1.1, y: 2.2, z: 3.3, w: 4.4 });
      q.conjugate();
      expect(q.x).to.equal(1.1 * -1);
      expect(q.y).to.equal(2.2 * -1);
      expect(q.z).to.equal(3.3 * -1);
    });
  });

  describe("normalization", () => {
    it("should normalize properly", () => {
      const q = new ROSLIB.Quaternion({ x: 2, y: 2, z: 2, w: 2 });
      q.normalize();

      expect(q.norm()).to.equal(1);
    });

    it("should normalize a 0 quaternion to {0, 0, 0, 1}", () => {
      const q = new ROSLIB.Quaternion({ x: 0, y: 0, z: 0, w: 0 });
      q.normalize();

      expect(q).to.eql({
        x: 0,
        y: 0,
        z: 0,
        w: 1,
      });
    });
  });
});
