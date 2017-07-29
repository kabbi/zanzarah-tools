exports.bmp2jpg = buffer => {
  const BMP = require('bmp-js');
  const JPEG = require('jpeg-js');
  return JPEG.encode(BMP.decode(buffer)).data;
};

exports.bmp2png = buffer => {
  const BMP = require('bmp-js');
  const { PNG } = require('pngjs');
  return PNG.sync.write(BMP.decode(buffer));
};

exports.mergeColorWithAlpha = (colorBmpData, alphaBmpData) => {
  const BMP = require('bmp-js');
  const { PNG } = require('pngjs');
  const colorImage = BMP.decode(colorBmpData);
  const alphaImage = BMP.decode(alphaBmpData);
  if (colorImage.width !== alphaImage.width || colorImage.height !== alphaImage.height) {
    throw new Error('Color and alpha texture sizes don\'t match');
  }

  const { data: alphaData } = alphaImage;
  const { width, height, data: colorData } = colorImage;
  const resultData = Buffer.alloc(width * height * 4);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const idx = (x + y * width) * 4;
      // Copy color values
      resultData[idx + 0] = colorData[idx + 0];
      resultData[idx + 1] = colorData[idx + 1];
      resultData[idx + 2] = colorData[idx + 2];
      // Use alpha image grayscale value as alpha
      const r = alphaData[idx + 0];
      const g = alphaData[idx + 1];
      const b = alphaData[idx + 2];
      resultData[idx + 3] = (r + g + b) / 3;
    }
  }
  return PNG.sync.write({
    data: resultData,
    width,
    height,
  });
};
