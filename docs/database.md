Data files
----------

_fb0x00.fbs - index file, describes the set of all available columns (across all other data files) and their human-readable names
_fb0x01.fbs - describes all the actors in the game, including their `aed` (mesh) file, characteristics, evolution data etc
_fb0x02.fbs - the list of all in-game strings, including text category (group), as well as unknown yet 'Define' field; excluding npc dialogs and texts
_fb0x03.fbs - spell list, with characteristics, prices, effect data and description ids
_fb0x04.fbs - maybe has the list of all usable in-game items, both unique, regular and spell ones, they also contain dynamic behaviour through scripts
_fb0x05.fbs - list of all available npcs (including interactable game-objects), with their scripts behaviour and one unknown field
_fb0x06.fbs - description of all dialog (quest) texts, mostly referenced in _fb0x05 scripts

Description format
------------------

<argName> - means any argument, text or string, omiting braces

Guessed commands
----------------

!.<npcTextUid>.<hasMoreCommandsFlag> - describes the starting phrase, shown before dialog begins; gives some variants if hasMoreCommandsFlag is set
".<id>.<npcTextUid> - describes the starting phrase dialog variants, id is a plain number, that can be referred below; this command(s) must follow the one above
J.<npcTextUid> - describes the next dialog page
;.0.<healthAmount> - item scripts - heal selected wizform with the specified health amount