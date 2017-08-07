import jBinary from 'jbinary';
import { typeSet } from './zanzarah-animation';

const parse = async fileNameOrBuffer => {
  let binary = null;
  if (Buffer.isBuffer(fileNameOrBuffer)) {
    binary = new jBinary(fileNameOrBuffer, typeSet);
  } else {
    binary = await jBinary.load(fileNameOrBuffer, typeSet);
  }
  return binary.readAll();
};

describe('parsers - zanzarah animation', () => {
  it('exports typeSet to parse', () => {
    expect(typeSet).toBeDefined();
  });
  it('parses smallest known files', async () => {
    expect(await parse('./public/fixtures/smallest-animation.ska')).toMatchSnapshot();
  });
  it('parses some random file', async () => {
    expect(await parse('./public/fixtures/animation.ska')).toMatchSnapshot();
  });
});
