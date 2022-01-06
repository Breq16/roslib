/**
 * @fileOverview
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

import UrdfMaterial from "./UrdfMaterial.js";
import UrdfLink from "./UrdfLink.js";
import UrdfJoint from "./UrdfJoint.js";
import { DOMParser } from "@xmldom/xmldom";

class UrdfModel {
  name: string;
  materials: Record<string, UrdfMaterial> = {};
  links: Record<string, UrdfLink> = {};
  joints: Record<string, UrdfJoint> = {};

  constructor({ xml, string }: { xml?: Document; string?: string } = {}) {
    if (string) {
      const parser = new DOMParser();
      xml = parser.parseFromString(string, "text/xml");
    }

    const robot = xml.documentElement;

    this.name = robot.getAttribute("name");

    Array.from(robot.childNodes).forEach((node: Element) => {
      if (node.tagName === "material") {
        const material = new UrdfMaterial({ xml: node });

        if (this.materials[material.name]) {
          if (this.materials[material.name].isLink()) {
            this.materials[material.name].assign(material);
          } else {
            console.warn("Material " + material.name + " is not unique.");
          }
        } else {
          this.materials[material.name] = material;
        }
      } else if (node.tagName === "link") {
        const link = new UrdfLink({ xml: node });

        if (this.links[link.name]) {
          console.warn("Link " + link.name + " is not unique.");
        } else {
          link.visuals
            .map((visual) => visual.material)
            .forEach((material, i) => {
              if (material && material.name) {
                if (this.materials[material.name]) {
                  link.visuals[i].material = this.materials[material.name];
                } else {
                  this.materials[material.name] = material;
                }
              }
            });

          this.links[link.name] = link;
        }
      } else if (node.tagName === "joint") {
        const joint = new UrdfJoint({ xml: node });

        if (this.joints[joint.name]) {
          console.warn("Joint " + joint.name + " is not unique.");
        } else {
          this.joints[joint.name] = joint;
        }
      }
    });
  }
}

export default UrdfModel;
