import UrdfColor from "./UrdfColor.js";

class UrdfMaterial {
  textureFilename?: string = null;
  color?: UrdfColor = null;
  name: string;

  constructor({ xml }: { xml: Element }) {
    this.name = xml.getAttribute("name");

    const textures = xml.getElementsByTagName("texture");
    if (textures.length > 0) {
      this.textureFilename = textures[0].getAttribute("filename");
    }

    const colors = xml.getElementsByTagName("color");
    if (colors.length > 0) {
      this.color = new UrdfColor({
        xml: colors[0],
      });
    }
  }

  isLink() {
    return this.color === null && this.textureFilename === null;
  }

  assign(object: any) {
    return Object.assign(this, object);
  }
}

export default UrdfMaterial;
