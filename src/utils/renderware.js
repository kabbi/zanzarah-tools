import isPlainObject from 'lodash/isPlainObject';

export const DefaultVersion = 0x0301;

export const section = (type, data, children) => {
  const result = {
    version: DefaultVersion,
    type,
  };
  // We support short form - section('RwType', children)
  if (Array.isArray(data) && !children) {
    result.children = data;
    return result;
  }
  if (isPlainObject(data)) {
    // If data is object - insert data section
    result.children = [{
      version: DefaultVersion,
      type: 'RwData',
      data,
    }, ...children || []];
  } else {
    // Otherwise, use it directly
    result.data = data;
  }
  return result;
};

export const getSection = (section, path) => {
  if (!path || path.length === 0) {
    return section;
  }
  const [ next ] = path;
  for (const child of section.children || []) {
    if (child.type === next) {
      return exports.getSection(child, path.slice(1));
    }
  }
  throw new Error(`Section not found: ${path.join('->')}`);
};

export const findSectionByType = (section, type) => {
  if (section.type === type) {
    return section;
  }
  for (const child of section.children || []) {
    const found = findSectionByType(child, type);
    if (found) {
      return found;
    }
  }
  return null;
};
