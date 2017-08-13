const BoundSymbol = Symbol('Bound');

const bindMethod = (component, handler) => {
  if (!component[handler][BoundSymbol]) {
    component[handler] = component[handler].bind(component);
    component[handler][BoundSymbol] = true;
  }
  return component[handler];
};

export const listen = (component, handler, target, event) => {
  const listener = bindMethod(component, handler);
  target.addEventListener(event, listener);
  return () => {
    target.removeEventListener(event, listener);
  };
};

export const bind = (component, handler, target, event) => {
  const callback = bindMethod(component, handler);
  const listener = e => {
    if (e.target !== target) {
      return;
    }
    callback(e);
  };
  target.addEventListener(event, listener);
  return () => {
    target.removeEventListener(event, listener);
  };
};

export const callLater = (...functions) => () => {
  functions.forEach(f => f());
};
