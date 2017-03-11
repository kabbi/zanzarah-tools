exports.LightTypes = {
  0x01: 'UnknownLight1',
  0x80: 'UnknownLight128',
  0x81: 'UnknownLight129',
};

exports.EffectTypes = {
  0x01: 'UnknownEffect1',
  0x04: 'UnknownEffect4',
  0x05: 'UnknownEffect5',
  0x06: 'UnknownEffect6',
  0x07: 'UnknownEffect7',
  0x0A: 'UnknownEffect10',
  0x0D: 'UnknownEffect13',
};

exports.EffectTypesV2 = {
  0x01: 'UnknownEffect1',
  0x06: 'UnknownEffect6',
  0x0A: 'UnknownEffect10',
  0x0B: 'SnowFlakesEffect',
  0x0D: 'UnknownEffect13',
};

exports.TriggerTypes = [
  'UnknownTrigger0',
  'UnknownTrigger1',
  'UnknownTrigger2',
];

exports.TriggerKind = [
  'Portal',
  'PlayerSpawn',
  'UnknownKind2',
  'NPC',
  // Used in cutscenes
  'CameraStop',
  // 28 and 35 are related to the sun
];
