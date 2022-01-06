class Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;

  constructor({ x = 0, y = 0, z = 0, w = 1 } = {}) {
    if ([x, y, z, w].includes(null)) {
      this.x = 0;
      this.y = 0;
      this.z = 0;
      this.w = 1;
    } else {
      this.x = x;
      this.y = y;
      this.z = z;
      this.w = w;
    }
  }

  conjugate() {
    this.x *= -1;
    this.y *= -1;
    this.z *= -1;
  }

  norm() {
    return Math.sqrt(
      this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w
    );
  }

  normalize() {
    const norm = this.norm();

    if (norm === 0) {
      this.x = 0;
      this.y = 0;
      this.z = 0;
      this.w = 1;
    } else {
      this.x /= norm;
      this.y /= norm;
      this.z /= norm;
      this.w /= norm;
    }
  }

  invert() {
    this.conjugate();
    this.normalize();
  }

  multiply(q: Quaternion) {
    const x = this.x * q.w + this.y * q.z - this.z * q.y + this.w * q.x;
    const y = -this.x * q.z + this.y * q.w + this.z * q.x + this.w * q.y;
    const z = this.x * q.y - this.y * q.x + this.z * q.w + this.w * q.z;
    const w = -this.x * q.x - this.y * q.y - this.z * q.z + this.w * q.w;

    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }

  clone() {
    return new Quaternion(this);
  }
}

export default Quaternion;
