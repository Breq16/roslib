class UrdfColor {
  r: number;
  g: number;
  b: number;
  a: number;

  constructor({ xml }: { xml: Element }) {
    const [r, g, b, a] = xml.getAttribute("rgba").split(" ").map(parseFloat);
    Object.assign(this, { r, g, b, a });
  }
}

export default UrdfColor;
