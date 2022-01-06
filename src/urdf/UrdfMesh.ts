import Vector3 from "../math/Vector3.js";
import UrdfTypes from "./UrdfTypes.js";

class UrdfMesh {
  type = UrdfTypes.URDF_MESH;
  filename: string;
  scale?: Vector3 = null;

  constructor({ xml }: { xml: Element }) {
    this.filename = xml.getAttribute("filename");

    const scale = xml.getAttribute("scale");
    if (scale) {
      const [x, y, z] = scale.split(" ").map(parseFloat);
      this.scale = new Vector3({ x, y, z });
    }
  }
}

export default UrdfMesh;
