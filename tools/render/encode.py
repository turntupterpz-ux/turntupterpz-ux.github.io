# Turn a folder of rendered PNG frames (00.png … 31.png) into the site's motion assets:
#   assets/motion/<name>/640/NN.webp, 360/NN.webp and poster.webp (the settled last frame).
# Usage: python3 tools/render/encode.py <png-folder> <name>
import os, sys
from PIL import Image

src, name = sys.argv[1], sys.argv[2]
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "assets", "motion", name)
for size in (640, 360):
    os.makedirs(os.path.join(root, str(size)), exist_ok=True)

frames = sorted(f for f in os.listdir(src) if f.endswith(".png") and f[:2].isdigit())
assert len(frames) == 32, "expected 32 frames, found %d" % len(frames)
for f in frames:
    im = Image.open(os.path.join(src, f)).convert("RGBA")
    if im.width != 640:
        im = im.resize((640, 640), Image.LANCZOS)
    stem = f[:2]
    im.save(os.path.join(root, "640", stem + ".webp"), "WEBP", quality=80, method=6)
    im.resize((360, 360), Image.LANCZOS).save(os.path.join(root, "360", stem + ".webp"), "WEBP", quality=80, method=6)
    if stem == "31":
        im.save(os.path.join(root, "poster.webp"), "WEBP", quality=88, method=6)
print("encoded", len(frames), "frames into", os.path.normpath(root))
