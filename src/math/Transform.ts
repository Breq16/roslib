import Vector3 from "./Vector3.js";
import Quaternion from "./Quaternion.js";

class Transform {
  translation: Vector3;
  rotation: Quaternion;

  constructor({
    translation,
    rotation,
  }: {
    translation?: Vector3 | { x: number; y: number; z: number };
    rotation?: Quaternion | { x: number; y: number; z: number; w: number };
  } = {}) {
    this.translation = new Vector3(translation);
    this.rotation = new Quaternion(rotation);
  }

  clone() {
    return new Transform(this);
  }
}

export default Transform;
