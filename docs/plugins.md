Some morph plugin
-----------------

Id: rwID_MORPHPLUGIN (0x105).

Extends geometry:
Format not yet known.

RpHAnimPlugin
-------------

Probably contains some hierarchical animation data.
Only present in animated files.

Id: probably rwID_ANIMPLUGIN (0x108).

Extends frame:
Not yet known.

Extends clump:
One unknown flag, stored as uint32. If set, anim plugin does some greater init.

RpSkinPlugin
------------

Contains the bones hierarchy for the model.
Only present in animated files.

Id: rwID_SKINPLUGIN (0x116).

Extends: atomic.

Atomic data:
Full bone hierarchy information. Weights, translations, parentship information, some unparced fields.

Some binmesh plugin
-------------------

Id: rwID_BINMESHPLUGIN (0x50E).

Extends geometry:
Format not yet known.
