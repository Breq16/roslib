import UrdfTypes from "./UrdfTypes.js";

class UrdfSphere {
  type = UrdfTypes.URDF_SPHERE;
  radius: number;

  constructor({ xml }: { xml: Element }) {
    this.radius = parseFloat(xml.getAttribute("radius"));
  }
}

export default UrdfSphere;
