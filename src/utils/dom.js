const IgnoreProps = ['__self', '__source'];

export const dom = (name, props, ...children) => {
  const element = document.createElement(name);
  for (const [ key, value ] of Object.entries(props)) {
    if (IgnoreProps.includes(key)) {
      continue;
    }
    if (value === true) {
      element.setAttribute(key, '');
    } else {
      element.setAttribute(key, value);
    }
  }
  const appendChild = child => {
    if (!child) {
      return;
    }
    if (Array.isArray(child)) {
      child.forEach(appendChild);
      return;
    }
    if (child instanceof HTMLElement) {
      element.appendChild(child);
      return;
    }
    throw new Error(`Unsupported child: ${child}`);
  };
  appendChild(children);
  return element;
};
