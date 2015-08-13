File formats
============

DFF
---

Renderware stream file. Contains static model's geometry and texture info.

Parser: dff-parser.coffee.

BSP
---

Renderware stream file. Contains static world geometry and texture info.

Parser: bsp-parser.coffee.

SKA
---

Renderware skin animation file. Contains some named (single) animation data, maybe managed by Rp(H)AnimPlugin.

Parser: ska-parser.coffee.

SCN
---

Zanzarah scene file. Contains scene definition, models, dynamic models, triggers, sounds, lights and lots of other things.
See dump-scene.coffee for complete format reference.

Parser: scene-parser.coffee.
Unparser: scene-serializer.coffe.

AED
---

Actor extended description file. Maps character animations to character models, assings effects, attaches wings.

ED
--

Effect combiner file. Contains complex effect definition for use in scene files.

FBS
---

Zanzarah game database files. Contain table-like data of variuos format, describing strings, spells, items, npcs, and scripts.

See: database.md.
Parser: fbs-parser.coffee.

game.cfg
--------

The file with the stored useless game options.

TODO: save files
----------------