import BaseFS from './BaseFS';

class CompositeFS extends BaseFS {
  constructor() {
    super();
    this.children = [];
  }

  add(fs) {
    this.children.push(fs);
    return () => {
      const { children } = this;
      const index = children.indexOf(fs);
      if (index !== -1) {
        children.splice(index, 1);
      }
    };
  }
}

export default CompositeFS;
