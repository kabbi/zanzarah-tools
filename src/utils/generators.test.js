import { generateUniformGridPositions } from './generators';

describe('utils - generators', () => {
  describe('generateUniformGridPositions', () => {
    it('returns initial position', () => {
      const generator = generateUniformGridPositions();
      const { value: { x, y } } = generator.next();
      expect(x).toBe(0);
      expect(y).toBe(0);
    });
    it('rotates several times', () => {
      const generator = generateUniformGridPositions();
      for (let i = 0; i < 10; i++) {
        generator.next();
      }
      const { value: { x, y } } = generator.next();
      expect(x).toBeCloseTo(-20);
      expect(y).toBeCloseTo(-20);
    });
  });
});
