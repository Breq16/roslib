import { expect } from "chai";
import * as ROSLIB from "../../src/index.js";

function clone(x) {
  const y = {};
  for (const prop in x) {
    if (x.hasOwnProperty(prop)) {
      y[prop] = typeof x[prop] === "object" ? clone(x[prop]) : x[prop];
    }
  }
  return y;
}

describe("Math examples", () => {
  let v1: ROSLIB.Vector3 | undefined;
  let v2: ROSLIB.Vector3 | undefined;
  let q1: ROSLIB.Quaternion | undefined;
  let q2: ROSLIB.Quaternion | undefined;
  let pos: ROSLIB.Pose | undefined;

  it("Vector3 example", () => {
    // Let's start by adding some vectors.
    v1 = new ROSLIB.Vector3({
      x: 1,
      y: 2,
      z: 3,
    });
    v2 = v1.clone();
    expect(v1).not.equal(v2);
    expect(v1).eql(v2);

    v1.add(v2);
    expect(clone(v1)).eql({
      x: 2,
      y: 4,
      z: 6,
    });

    const v3 = v1.clone();
    v3.subtract(v2);
    expect(clone(v3)).eql(clone(v2));
  });

  it("Quaternion example", () => {
    // Now let's play with some quaternions.
    q1 = new ROSLIB.Quaternion({
      x: 0.1,
      y: 0.2,
      z: 0.3,
      w: 0.4,
    });

    q2 = q1.clone();

    expect(q1).not.equal(q2);
    expect(q1).eql(q2);

    q1.multiply(q2);
    q1.invert();

    expect(q1.x).to.be.within(-0.26667, -0.26666);
    expect(q1.y).to.be.within(-0.53334, -0.53333);
    expect(q1.z).to.be.within(-0.8, -0.79999);
    expect(q1.w).to.be.within(0.06666, 0.06667);
  });

  it("Pose example", () => {
    // Let's copy the results into a pose.
    pos = new ROSLIB.Pose({
      position: v1,
      orientation: q1,
    });
    expect(clone(pos)).to.eql(clone({ position: v1, orientation: q1 }));
  });

  it("Multiplication example", () => {
    const pos2 = new ROSLIB.Pose({
      position: v2,
      orientation: q2,
    });

    const result = pos2.multiply(pos);

    expect(result.orientation.x).to.be.within(-0.1, -0.09999);
    expect(result.orientation.y).to.be.within(-0.20001, -0.2);
    expect(result.orientation.z).to.be.within(-0.3, -0.29999);
    expect(result.orientation.w).to.be.within(0.39999, 0.4);

    expect(result.position.x).to.be.within(1.6, 1.60001);
    expect(result.position.y).to.be.within(3.2, 3.20001);
    expect(result.position.z).to.be.within(4.8, 4.80001);
  });

  it("Transform example", () => {
    // Finally, let's play with some transforms.
    const tf = new ROSLIB.Transform({
      translation: v2,
      rotation: q2,
    });

    pos.applyTransform(tf);
    expect(pos.orientation.x).to.be.within(-0.1, -0.09999);
    expect(pos.orientation.y).to.be.within(-0.20001, -0.2);
    expect(pos.orientation.z).to.be.within(-0.3, -0.29999);
    expect(pos.orientation.w).to.be.within(0.39999, 0.4);

    expect(pos.position.x).to.be.within(1.6, 1.60001);
    expect(pos.position.y).to.be.within(3.2, 3.20001);
    expect(pos.position.z).to.be.within(4.8, 4.80001);
  });
});
