import jBinary from 'jbinary';
import { typeSet } from './renderware';

const parse = async fileName => {
  const binary = await jBinary.load(fileName, typeSet);
  return binary.readAll();
};

describe('parsers - zanzarah', () => {
  it('exports typeSet to parse', () => {
    expect(typeSet).toBeDefined();
  });
  pit('parses empty file', async () => {
    expect(await parse('./public/fixtures/empty.dff')).toEqual([]);
  });
  pit('parses known models', async () => {
    expect(await parse('./public/fixtures/smallest.dff')).toMatchSnapshot();
  });
});
