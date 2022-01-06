import Pose from "../math/Pose.js";
import Vector3 from "../math/Vector3.js";
import Quaternion from "../math/Quaternion.js";

class UrdfJoint {
  name: string;
  type: string;
  parent: string;
  child: string;
  minval: number;
  maxval: number;
  origin: Pose;

  constructor({ xml }: { xml: Element }) {
    this.name = xml.getAttribute("name");
    this.type = xml.getAttribute("type");

    const parents = xml.getElementsByTagName("parent");
    if (parents.length > 0) {
      this.parent = parents[0].getAttribute("link");
    }

    const children = xml.getElementsByTagName("child");
    if (children.length > 0) {
      this.child = children[0].getAttribute("link");
    }

    const limits = xml.getElementsByTagName("limit");
    if (limits.length > 0) {
      this.minval = parseFloat(limits[0].getAttribute("lower"));
      this.maxval = parseFloat(limits[0].getAttribute("upper"));
    }

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
  }
}

export default UrdfJoint;
