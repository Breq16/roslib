import { expect } from "chai";
import decompressPng from "../src/util/decompressPng.js";

import Jimp from "jimp";

describe("Decompress PNG", () => {
  it("Decompresses PNG images", async () => {
    const messageStr = "Hello World! This message will be compressed as PNG.";
    const messageJson = JSON.stringify({ msg: messageStr });

    const encoder = new TextEncoder();

    const messageArray = encoder.encode(messageJson);

    const image = await Jimp.create(Math.ceil(messageArray.length / 4), 1);

    for (let i = 0; i < messageArray.length; i++) {
      image.bitmap.data[i] = messageArray[i];
    }
    for (let i = messageArray.length; i < image.bitmap.data.length; i++) {
      image.bitmap.data[i] = " ".charCodeAt(0);
    }

    const pngData = await image.getBufferAsync(Jimp.MIME_PNG);
    const b64data = pngData.toString("base64");

    const decompress = await decompressPng(b64data);

    expect(decompress.msg).to.equal(messageStr);
  });

  it("Handles invalid PNGs", (done) => {
    decompressPng("invalid")
      .then(() => expect.fail())
      .catch(() => done());
  });
});
