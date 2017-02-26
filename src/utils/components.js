const BoundSymbol = Symbol('Bound');

export const bind = (component, handler, target, event) => {
  if (!component[handler][BoundSymbol]) {
    component[handler] = component[handler].bind(component);
    component[handler][BoundSymbol] = true;
  }
  target.addEventListener(event, component[handler]);
  return () => {
    target.removeEventListener(event, component[handler]);
  };
};

export const callLater = (...functions) => () => {
  functions.forEach(f => f());
};
