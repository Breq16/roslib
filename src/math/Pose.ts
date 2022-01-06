import Vector3 from "./Vector3.js";
import Quaternion from "./Quaternion.js";
import Transform from "./Transform.js";

class Pose {
  position: Vector3;
  orientation: Quaternion;

  constructor({
    position,
    orientation,
  }: {
    position?: Vector3 | { x: number; y: number; z: number };
    orientation?: Quaternion | { x: number; y: number; z: number; w: number };
  } = {}) {
    this.position = new Vector3(position);
    this.orientation = new Quaternion(orientation);
  }

  applyTransform(tf: Transform) {
    this.position.multiplyQuaternion(tf.rotation);
    this.position.add(tf.translation);

    const rotation = tf.rotation.clone();
    rotation.multiply(this.orientation);
    this.orientation = rotation;
  }

  clone() {
    return new Pose(this);
  }

  multiply(pose: Pose) {
    const result = pose.clone();
    result.applyTransform(
      new Transform({
        rotation: this.orientation,
        translation: this.position,
      })
    );
    return result;
  }

  getInverse() {
    const inverse = this.clone();
    inverse.orientation.invert();
    inverse.position.multiplyQuaternion(inverse.orientation);
    inverse.position.x *= -1;
    inverse.position.y *= -1;
    inverse.position.z *= -1;
    return inverse;
  }
}

export default Pose;
