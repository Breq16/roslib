/**
 * If a message was compressed as a PNG image (a compression hack since
 * gzipping over WebSockets * is not supported yet), this function decodes
 * the "image" as a Base64 string.
 */
function decompressPng(data): Promise<any> {
  if (globalThis.Buffer) {
    // Node
    const buffer = Buffer.from(data, "base64");

    return new Promise((resolve, reject) => {
      import("pngparse").then((pngparse) =>
        pngparse.parse(buffer, (err, png) => {
          if (err) {
            console.warn("Cannot process PNG encoded message:", err);
            reject(err);
          } else {
            const jsonData = png.data.toString();
            resolve(JSON.parse(jsonData));
          }
        })
      );
    });
  } else {
    // Browser
    const image = new Image();

    return new Promise((resolve, reject) => {
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width, (canvas.height = image.width), image.height;
        context.imageSmoothingEnabled = false;

        context.drawImage(image, 0, 0);

        var imageData = context.getImageData(
          0,
          0,
          image.width,
          image.height
        ).data;

        let jsonData = "";
        for (var i = 0; i < imageData.length; i += 4) {
          jsonData += String.fromCharCode(
            imageData[i],
            imageData[i + 1],
            imageData[i + 2],
            imageData[i + 3]
          );
        }
        resolve(JSON.parse(jsonData));
      };

      image.onerror = (error) => {
        console.warn("Cannot process PNG encoded message:", error);
        reject(error);
      };

      image.src = "data:image/png;base64," + data;
    });
  }
}

export default decompressPng;
