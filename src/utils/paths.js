exports.CommonPaths = {
  Resources: 'Resources',
  Pack: 'Pack',
  Worlds: 'Pack/WORLDS',
  ActorModels: 'Pack/MODELS/ACTORSEX',
  BackdropModels: 'Pack/MODELS/BACKDROPS',
  StaticModels: 'Pack/MODELS/MODELS',
  Textures: 'Pack/TEXTURES',
  ActorTextures: 'Pack/TEXTURES/ACTORSEX',
  BackdropTextures: 'Pack/TEXTURES/BACKDROPS',
  EffectTextures: 'Pack/TEXTURES/EFFECTS',
  MiscTextures: 'Pack/TEXTURES/MISC',
  StaticTextures: 'Pack/TEXTURES/MODELS',
  WorldTextures: 'Pack/TEXTURES/WORLDS',
};

exports.getRootPath = () => {
  if (global.window) {
    return 'http://localhost:4343/';
  }
  if (!process.env.ZANZARAH_ROOT) {
    throw new Error('You must specify zanzarah root path in ZANZARAH_ROOT env var');
  }
  return process.env.ZANZARAH_ROOT;
};
