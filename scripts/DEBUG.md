While developing your own zanzarah parsing scripts, you may want to run them on all files at once, to verify they work on all zanzarah files. You can use unix tools to do this efficiently:

```sh
# To check the parser works on all scenes
find $ZANZARAH_ROOT/Resources/Worlds -name "*.scn" | parallel ./scripts/parse-scene --status-only
# To find out all unique combinations of atomic sections
find $ZANZARAH_ROOT/Pack/MODELS -name "*.DFF" | parallel ./scripts/parse-renderware -t debug-atomic | sort | uniq
```
