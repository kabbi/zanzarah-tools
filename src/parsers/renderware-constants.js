exports.SectionTypes = {
  0x00000001: 'RwData',
  0x00000002: 'RwString',
  0x00000003: 'RwExtension',
  0x00000006: 'RwTexture',
  0x00000007: 'RwMaterial',
  0x00000008: 'RwMaterialList',
  0x00000009: 'RwAtomicSector',
  0x0000000A: 'RwPlaneSector',
  0x0000000B: 'RwWorld',
  0x0000000E: 'RwFrameList',
  0x0000000F: 'RwGeometry',
  0x00000010: 'RwClump',
  0x00000014: 'RwAtomic',
  0x0000001A: 'RwGeometryList',
  0x00000108: 'RwAnimPlugin',
  0x00000116: 'RwSkinPlugin',
  0x0000011D: 'RwCollisionPlugin',
  0x0000050E: 'RwMaterialSplit',
  // What is this thing?
  // 0x0253F2FE: 'RwFrame',
  0x00000202: 'RwEof',
};

exports.RootSections = [
  'RwClump',
  'RwWorld',
];

exports.GeometryFlags = {
  RwTriangleStrip: 0x01,
  RwPositions: 0x02,
  // One and only one set of texcoords
  RwTextured: 0x04,
  RwPrelit: 0x08,
  RwNormals: 0x10,
  RwLight: 0x20,
  RwModulateMaterialColor: 0x40,
  // At least 2 sets of texcoords
  RwTextured2: 0x80,
  RwNative: 0x01000000,
  RwNativeInstance: 0x02000000,
  // These are masks, not actual flags
  RwFlagsMask: 0xFF,
  RwNativeFlagsMask: 0x0F000000,
};

exports.WorldFlags = Object.assign({}, exports.GeometryFlags, {
  // Whether to store both vals, or only one
  RpWorldSectorOverlap: 0x40000000,
});

exports.FilterModes = [
  'RwNone',
  'RwNearest',
  'RwLinear',
  'RwMipNearest',
  'RwMipLinear',
  'RwLinearMipNearest',
  'RwLinearMipLinear',
];

exports.AddressModes = [
  'RwDefault',
  'RwWrap',
  'RwMirror',
  'RwClamp',
  'RwBorder',
];
