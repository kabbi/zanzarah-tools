import { Vector2 } from 'three';

export function * generateUniformGridPositions(delta = 1) {
  const current = new Vector2();
  const direction = new Vector2(delta, 0);
  const center = new Vector2();

  let stepsBeforeTurn = 1;
  let currentSteps = 0;
  let turnsMade = 0;

  while (true) {
    yield current;
    current.add(direction);

    currentSteps += 1;
    if (currentSteps >= stepsBeforeTurn) {
      direction.rotateAround(center, Math.PI / 2);
      currentSteps = 0;
      turnsMade++;
      if (turnsMade >= 2) {
        stepsBeforeTurn += 1;
        turnsMade = 0;
      }
    }
  }
}
