import fs from 'fs';
import jBinary from 'jbinary';
import { typeSet } from './renderware';

const SmallestKnownFiles = [
  './public/fixtures/smallest-empty.dff',
  './public/fixtures/smallest-geometry.dff',
  './public/fixtures/smallest-animated.dff',
  './public/fixtures/smallest-world.bsp',
];

const parse = async fileNameOrBuffer => {
  let binary = null;
  if (Buffer.isBuffer(fileNameOrBuffer)) {
    binary = new jBinary(fileNameOrBuffer, typeSet);
  } else {
    binary = await jBinary.load(fileNameOrBuffer, typeSet);
  }
  return binary.readAll();
};

const serialize = data => {
  const binary = new jBinary(JSON.stringify(data).length, typeSet);
  const bytesWritten = binary.writeAll(data);
  return binary.view.buffer.slice(0, bytesWritten);
};

describe('parsers - zanzarah', () => {
  it('exports typeSet to parse', () => {
    expect(typeSet).toBeDefined();
  });
  pit('parses empty file', async () => {
    expect(await parse('./public/fixtures/empty.dff')).toEqual([]);
  });
  pit('parses smallest known files', async () => {
    for (const file of SmallestKnownFiles) {
      expect(await parse(file)).toMatchSnapshot();
    }
  });
  pit('parses file with wrong RwClump size', async () => {
    expect(await parse('./public/fixtures/wrong-root-size.dff')).toMatchSnapshot();
  });

  it('serializes empty data', () => {
    expect(serialize([])).toEqual(Buffer.from([]));
  });
  pit('performs parse-serialize-parse on smallest known files', async () => {
    // We are comparing parsed representation here, not binary blobls, because
    // parsed json is easier to diff by jest, and binary representation may be
    // slightly different, but stil valid
    for (const file of SmallestKnownFiles) {
      const rawData = fs.readFileSync(file);
      const parsed = await parse(rawData);
      const serialized = serialize(parsed);
      const parsedAgain = await parse(serialized);
      expect(parsedAgain).toEqual(parsed);
    }
  });
});
