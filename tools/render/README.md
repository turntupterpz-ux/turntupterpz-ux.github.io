# Product renders

Blender scripts for the product animations (`assets/motion/<product>/`) and the 2g disposable
studio shots (`assets/images/products/`). Each script builds its scene from scratch: models,
materials, studio lights and camera. Units are centimetres.

| Script | What it makes |
| --- | --- |
| `rosin.py` | Whipped live rosin in a thick glass jar; the black lid unscrews and sets down beside it |
| `diamonds.py` | An intergrown THCa crystal cluster with loose crystals and shards falling in |
| `sauce.py` | A pool of amber terp sauce with THCa crystals dropping into it |
| `sift.py` | A pile of dry sift on parchment, sprinkled in from above |
| `crumble.py` | Porous golden crumble chunks tumbling onto parchment |
| `disposable.py` | The 2g disposable: one pen standing, one lying (after the supplier photo). `--still` renders the studio shot with the white backdrop |

Shared pieces: `common.py` (render settings, studio lights, camera framing, materials),
`crystals.py` (THCa crystal shapes and material), `props.py` (lathe, parchment, grains).

## Re-rendering

Needs Blender 4.5 and a studio HDRI, e.g. Poly Haven's `studio_small_09` (CC0):

```sh
# 32 transparent frames, then convert them into the site's WebP sizes
blender -b -P tools/render/diamonds.py -- --out /tmp/diamonds --hdri studio_small_09_2k.hdr --samples 80
python3 tools/render/encode.py /tmp/diamonds diamonds

# the disposable studio shots
blender -b -P tools/render/disposable.py -- --out /tmp/still --still --res 1600 --hdri studio_small_09_2k.hdr
blender -b -P tools/render/disposable.py -- --out /tmp/still --still --aspect 1.4545 --name disposable-2g-wide.png --res 1600 --hdri studio_small_09_2k.hdr
```

Preview one frame quickly with `--frames 31 --samples 16`.
