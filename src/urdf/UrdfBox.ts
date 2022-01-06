import Vector3 from "../math/Vector3.js";
import UrdfTypes from "./UrdfTypes.js";

class UrdfBox {
  type = UrdfTypes.URDF_BOX;
  dimension: Vector3;

  constructor({ xml }: { xml: Element }) {
    const [x, y, z] = xml.getAttribute("size").split(" ").map(parseFloat);
    this.dimension = new Vector3({ x, y, z });
  }
}

export default UrdfBox;
