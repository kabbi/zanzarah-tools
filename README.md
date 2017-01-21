Zanzarah tools
==============

This repo contains all my Zanzarah editing and browsing tools. It came out from the effort to reverse-engineer the wonderful game: **Zanzarah - the Hidden Portal**, to provide all the tools for community to make various mods, modify the world and to enhance this pretty old game.

### Work In progress

I've actually started refactoring all my last tools, written in coffee-script, dissolve for parsing and node-webgl for ui with the modern stack - node v7 and es6, jBinary for parsing, and react/aframe based webapp for editing and visualization tools. This transition is currently undergoing, and I'm gradually removing the old tools and files. Right now, everything in `/src` is the new toolset, and you can already use something like

```sh
git clone https://github.com/kabbi/zanzarah-tools.git
cd zanzarah-tools
npm install

# Paste the path to your zanzarah game here
export ZANZARAH_ROOT=~/games/Zanzarah
mkdir -p $ZANZARAH_ROOT/Pack
# Unpack packed data
zanzapack u $ZANZARAH_ROOT/Resources/data_0.pak $ZANZARAH_ROOT/Pack $ZANZARAH_ROOT/Pack/packfiles.txt
# Normalize file structure a bit
mv $ZANZARAH_ROOT/Pack/RESOURCES/* $ZANZARAH_ROOT/Pack
# Remove empty dir
rmdir $ZANZARAH_ROOT/Pack/RESOURCES

# Start the tools
npm start
```

There are also some tools in `scripts` folder.

I will update this readme when the transition is finished, and I'll also upload working web-version of all the tools to gh-pages. You can still ask me directly any questions you want.

All the info below is thus deprecated, although stil correct.

### Inspiration

The cool challenge was to implement this entirely using JS (or Coffee, I just love it), so all the desktop apps in this repo have cool 3D interface, and are stil written in JS :). Based entirely on [**three.js**](https://github.com/mrdoob/three.js/) - great javascript webgl library, by [Mrdoob](https://github.com/mrdoob), which was adapted by me to run on desktop OpenGL using [node-webgl](https://github.com/mikeseven/node-webgl).

### Research

Zanzarah was written using RenderWare engine, as it states on the splash screen. Unfortunately, after long nights googling I found no info about engine version 3.11 (we can see that in settings). But I've got SDK from the older (or newer, no way to know) RenderWare engine 3.7, used in old GTA games. And it helped a lot, as most data structures were the same.

Most things I googled, some binary file format I got from disassembling zanzarah binary with IDA Pro, some just guessed. Anyway, now I have enough information to parse many binary game resources, and to implement converters / exporters / editors so that it is possible to modify original game data to make something really cool.

### Try yourself

Unfortunately, I'm too lazy by now to make this repo easily runnable by everyone. It is currently work in progress. But feel free to ask me directly about any questions, or create an issue / pull request.

Basically, you'll need to install my fork of three.js from [here](https://github.com/kabbi/three.js/), and put this code dir into any subdir in zanzarah data folder. Also I don't currently support zanzarah packet file format, so you need to unpack the files youself (for example, using [zanzapack](http://aluigi.altervista.org/search.php?src=unpacker) tool).

### Things already done:

- '.dff' file parser - 3D model file format, by renderware
    - geometry and material data sections are parsed almost completely
    - skeleton and bones information are working, but not everything has been recognized
    - three.js loader is done
- '.ska' file parser - animation file format, by renderware
    - animation data is fully parsed
    - the THREE.js loader is working (except for blending multiple animations, though I doubt I'll need those in my editor tools)
- '.bsp' file parser - 3D world file format, by renderware
    - geometry and material data sections are parsed almost completely
    - three.js loader is done
- '.ed' file parser - effect file format, zanzarah-specific
    - only basic parser is done, data is mostly not understood
- '.scn' file parser - scene file format, zanzarah-specific
    - everything except effects and waypoints is parsed
    - three.js loader is done
- '.fbs' file parser - database file format, zanzarah-specific
    - parser itself is working, although it is in a not-very-good state
    - data format specification is mostly understood, although there are several unknown fields and object types
- console tools and apps
    - all `*-parser.coffee` files can be ran from command line, they read the data from standart input, and output pretty json to standart output, so you can use them anywhere
- GUI tools and apps
    - `editor/utils/view-dff.coffee` 3d model viewer tool, shows you the base geometry, loads textures and displays bones / frames
    - `editor/utils/view-scene.coffee` zanzarah scene viewer, just loads the whole scene and allows you to rotate (navigate) it
    - `editor/editor.coffe` scene editor tool, allows you to load any scene, move objects around, edit their properties and save scene back

### Things to do:

- Actor definition (.aed) file parser: easy enough to implement, data format is simple. It just ties together 3d model files and animation files.
- Refactor renderware stream file parsers (dff and bsp): my current parser was evolving for a long time, and is really messy as of now. It doesn't support full renderware stream file format, and currently is really inefficient.
- Zanzarah viewer: implement the ultimate GUI app to view all zanzarah resources, specifically actors, worlds, scenes, models, effects, textures, animations and data files. Existing editor component-entity-system architecture can be reused.
- Effect files format: this is zanzarah-specific, and hard to reverse-engineer using zanzarah binary only, so lots of things should be guessed.
- Script system: reverse-engineer internal zanzarah script files (see `docs/database.md` and `editor/data/Script examples.md` for my current progress).

### Legal stuff

Please, use these tools only on your legally bought Zanzarah game copy. All the code in this repo is for educational purpose only, I intent to make no commercial activity out of my toolset.
