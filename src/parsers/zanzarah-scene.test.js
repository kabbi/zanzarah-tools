import fs from 'fs';
import jBinary from 'jbinary';
import { typeSet } from './zanzarah-scene';

const parse = async fileNameOrBuffer => {
  let binary = null;
  if (Buffer.isBuffer(fileNameOrBuffer)) {
    binary = new jBinary(fileNameOrBuffer, typeSet);
  } else {
    binary = await jBinary.load(fileNameOrBuffer, typeSet);
  }
  return binary.readAll();
};

describe('parsers - zanzarah scene', () => {
  it('exports typeSet to parse', () => {
    expect(typeSet).toBeDefined();
  });
  it('parses empty file', async () => {
    expect(await parse('./public/fixtures/empty.dff')).toEqual({});
  });
  it('parses smallest known files', async () => {
    expect(await parse('./public/fixtures/smallest-scene.scn')).toMatchSnapshot();
  });
});
