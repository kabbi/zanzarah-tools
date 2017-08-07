import jBinary from 'jbinary';
import { typeSet } from './zanzarah-actor';

const parse = async fileNameOrBuffer => {
  const binary = await jBinary.load(fileNameOrBuffer, typeSet);
  return binary.readAll();
};

describe('parsers - zanzarah actor', () => {
  it('exports typeSet to parse', () => {
    expect(typeSet).toBeDefined();
  });
  it('parses amy definition', async () => {
    expect(await parse('./public/fixtures/actor-amy.aed')).toMatchSnapshot();
  });
  it('parses random fairy definition', async () => {
    expect(await parse('./public/fixtures/actor-fairy.aed')).toMatchSnapshot();
  });
});
