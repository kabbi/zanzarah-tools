const jBinary = require('jbinary');
const padStart = require('lodash/padStart');
const debug = require('debug')('app:utils:jbinary');

exports.parent = (prop, level = 1) => function () {
  return this.binary.getContext(level)[prop];
};

exports.Hex = jBinary.Template({
  setParams(itemType, padding) {
    this.baseType = itemType;
    this.padding = padding;
  },
  read() {
    const result = this.baseRead().toString(16);
    return this.padding ? padStart(result, this.padding, 0) : result;
  },
  write(value) {
    this.baseWrite(parseInt(value, 16));
  },
});

exports.Switch = jBinary.Template({
  params: ['condition'],
  getBaseType() {
    return this.toValue(this.condition);
  },
});

exports.ChildChunk = jBinary.Type({
  params: ['itemType', 'size'],
  resolve(getType) {
    this.itemType = getType(this.itemType);
  },
  read() {
    const offset = this.binary.tell();
    const size = this.toValue(this.size);
    this.binary.skip(size);

    const childBinary = this.binary.slice(offset, offset + size);
    childBinary.contexts = this.binary.contexts;
    return childBinary.read(this.itemType);
  },
  write(data) {
    // We ignore the size in write mode
    this.binary.write(this.itemType, data);
  },
});

exports.DynamicArray = jBinary.Template({
  setParams(itemType) {
    this.baseType = {
      length: 'uint32',
      values: ['array', itemType, 'length'],
    };
  },
  read() {
    return this.baseRead().values;
  },
  write(values) {
    this.baseWrite({
      length: values.length,
      values,
    });
  },
});

exports.DynamicString = jBinary.Template({
  setParams() {
    this.baseType = {
      length: 'uint32',
      str: ['string', 'length'],
    };
  },
  read() {
    return this.baseRead().str;
  },
  write(str) {
    this.baseWrite({
      length: str.length,
      str,
    });
  },
});

exports.DumpContext = jBinary.Type({
  params: ['prefix', 'level'],
  setParams(prefix, level) {
    this.level = level || 0;
    this.prefix = prefix || '';
  },
  read() {
    debug(this.prefix, this.binary.getContext(this.level));
  },
  write() {
    debug(this.prefix, this.binary.getContext(this.level));
  },
});

exports.BitFlags = jBinary.Template({
  setParams(baseType, allFlags) {
    this.baseType = baseType;
    this.allFlags = allFlags;
  },
  read() {
    const value = this.baseRead();
    const flags = {};
    for (const key of Object.keys(this.allFlags)) {
      const flagValue = this.allFlags[key];
      flags[key] = (value & flagValue) === flagValue;
    }
    return flags;
  },
  write(flags) {
    let value = 0;
    for (const key of Object.keys(flags)) {
      if (flags[key]) {
        value |= this.allFlags[key];
      }
    }
    this.baseWrite(value);
  },
});

exports.Tap = jBinary.Type({
  params: ['fn'],
  read(context) {
    this.fn(context);
  },
  write(_, context) {
    this.fn(context);
  },
});

/**
 * TODO: I've written this to help myself transition from dissolve dsl, but in
 * jBinary world removing some fields is a bad decision, as we might need to write
 * them back. So we need to write custom types to read/write dynamic removable
 * fields (like array length, etc), and preserve unknown fields.
 */
exports.Remove = jBinary.Type({
  setParams(...fields) {
    this.fields = fields;
  },
  read(context) {
    for (const field of this.fields) {
      delete context[field];
    }
  },
});
