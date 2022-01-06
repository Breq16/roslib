import UrdfTypes from "./UrdfTypes.js";

class UrdfCylinder {
  type = UrdfTypes.URDF_CYLINDER;
  length: number;
  radius: number;

  constructor({ xml }: { xml: Element }) {
    this.length = parseFloat(xml.getAttribute("length"));
    this.radius = parseFloat(xml.getAttribute("radius"));
  }
}

export default UrdfCylinder;
