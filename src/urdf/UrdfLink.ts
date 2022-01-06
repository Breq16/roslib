import UrdfVisual from "./UrdfVisual.js";

class UrdfLink {
  name: string;
  visuals: UrdfVisual[];

  constructor({ xml }: { xml: Element }) {
    this.name = xml.getAttribute("name");
    this.visuals = Array.from(xml.getElementsByTagName("visual")).map(
      (xml) => new UrdfVisual({ xml })
    );
  }
}

export default UrdfLink;
