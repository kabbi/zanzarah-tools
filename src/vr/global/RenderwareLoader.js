import { THREE } from 'aframe/src';

THREE.RenderwareLoader = class RenderwareLoader {
  _getData(section) {
    if (!section.children || !section.children[0] || section.children[0].type !== 'RwData') {
      throw new Error(`No data section found for ${section.type}`);
    }
    return section.children[0].data;
  }

  _traverse(sections, path = '', ...otherArgs) {
    for (const section of sections) {
      const handlerName = `_handle${section.type}`;
      if (this[handlerName] && this[handlerName](section, path, ...otherArgs)) {
        continue;
      }
      if (section.children) {
        this._traverse(section.children, `${path}.${section.type}`, ...otherArgs);
      }
    }
  }
};
