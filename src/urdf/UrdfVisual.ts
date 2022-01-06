import Pose from "../math/Pose.js";
import Vector3 from "../math/Vector3.js";
import Quaternion from "../math/Quaternion.js";

import UrdfCylinder from "./UrdfCylinder.js";
import UrdfBox from "./UrdfBox.js";
import UrdfMaterial from "./UrdfMaterial.js";
import UrdfMesh from "./UrdfMesh.js";
import UrdfSphere from "./UrdfSphere.js";

class UrdfVisual {
  origin?: Pose = null;
  geometry?: UrdfMesh | UrdfBox | UrdfCylinder | UrdfSphere = null;
  material?: UrdfMaterial = null;
  name: string;

  constructor({ xml }: { xml: Element }) {
    this.origin = null;
    this.geometry = null;
    this.material = null;

    this.name = xml.getAttribute("name");

    const origins = xml.getElementsByTagName("origin");
    if (origins.length === 0) {
      // use the identity as the default
      this.origin = new Pose();
    } else {
      const xyz = origins[0].getAttribute("xyz");
      let position = new Vector3();
      if (xyz) {
        const [x, y, z] = xyz.split(" ").map(parseFloat);
        position = new Vector3({ x, y, z });
      }

      const rpy = origins[0].getAttribute("rpy");
      let orientation = new Quaternion();
      if (rpy) {
        const [roll, pitch, yaw] = rpy.split(" ").map(parseFloat);

        const phi = roll / 2.0;
        const the = pitch / 2.0;
        const psi = yaw / 2.0;

        const x =
          Math.sin(phi) * Math.cos(the) * Math.cos(psi) -
          Math.cos(phi) * Math.sin(the) * Math.sin(psi);
        const y =
          Math.cos(phi) * Math.sin(the) * Math.cos(psi) +
          Math.sin(phi) * Math.cos(the) * Math.sin(psi);
        const z =
          Math.cos(phi) * Math.cos(the) * Math.sin(psi) -
          Math.sin(phi) * Math.sin(the) * Math.cos(psi);
        const w =
          Math.cos(phi) * Math.cos(the) * Math.cos(psi) +
          Math.sin(phi) * Math.sin(the) * Math.sin(psi);

        orientation = new Quaternion({ x, y, z, w });
        orientation.normalize();
      }

      this.origin = new Pose({
        position: position,
        orientation: orientation,
      });
    }

    const geometries = xml.getElementsByTagName("geometry");
    if (geometries.length > 0) {
      const geometry = geometries[0];
      const shape = Array.from(geometry.childNodes).find(
        (node) => node.nodeType === 1
      ) as Element;

      const type = shape.nodeName;
      if (type === "sphere") {
        this.geometry = new UrdfSphere({ xml: shape });
      } else if (type === "box") {
        this.geometry = new UrdfBox({ xml: shape });
      } else if (type === "cylinder") {
        this.geometry = new UrdfCylinder({ xml: shape });
      } else if (type === "mesh") {
        this.geometry = new UrdfMesh({ xml: shape });
      } else {
        console.warn("Unknown geometry type " + type);
      }
    }

    const materials = xml.getElementsByTagName("material");
    if (materials.length > 0) {
      this.material = new UrdfMaterial({
        xml: materials[0],
      });
    }
  }
}

export default UrdfVisual;
