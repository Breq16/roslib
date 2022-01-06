import { expect } from "chai";
import * as ROSLIB from "../../src/index.js";

describe("Pose", () => {
  it("clones itself", () => {
    const p = new ROSLIB.Pose({
      position: { x: 1, y: 2, z: 3 },
      orientation: { x: 0.9, y: 0.8, z: 0.7, w: 1 },
    });

    const p2 = p.clone();

    expect(p).not.equal(p2);
    expect(p).eql(p2);
  });

  it("inverts itself", () => {
    const p = new ROSLIB.Pose({
      position: { x: 1, y: 2, z: 3 },
      orientation: { x: 0.9, y: 0.8, z: 0.7, w: 1 },
    });

    const v = new ROSLIB.Vector3({ x: -1, y: -2, z: -3 });
    const q = new ROSLIB.Quaternion({ x: 0.9, y: 0.8, z: 0.7, w: 1 });
    q.invert();
    v.multiplyQuaternion(q);

    expect(p.getInverse()).eql(
      new ROSLIB.Pose({
        position: v,
        orientation: q,
      })
    );
  });
});
