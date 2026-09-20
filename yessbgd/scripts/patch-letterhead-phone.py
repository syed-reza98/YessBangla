"""Patch baked-in old phone in letterhead JPEG with new number, in-place."""
from PIL import Image, ImageDraw, ImageFont

SRC = "/dev-server/public/yess-bangla-letterhead.jpeg"
FONT = "/nix/store/0hdgmcjy7q8zn7h3amz8nf96l9qh7wv0-liberation-fonts-2.1.5/share/fonts/truetype/LiberationSans-Bold.ttf"
NEW_PHONE = "+880 1805-464343"

im = Image.open(SRC).convert("RGB")
W, H = im.size
draw = ImageDraw.Draw(im)

# Bottom navy/teal contact band: y ≈ 1550..1599, color (1, 160, 199).
band_top, band_bottom = 1551, H
band_color = (1, 160, 199)
draw.rectangle([0, band_top, W, band_bottom], fill=band_color)

# Compose the rewritten band line with new phone.
text = f"Cell : {NEW_PHONE}    E-mail : yessbangla.bd@gmail.com    Web : www.yessbd.com"
font = ImageFont.truetype(FONT, 22)

# Center horizontally and vertically inside the band.
bbox = draw.textbbox((0, 0), text, font=font)
tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
x = (W - tw) // 2
y = band_top + ((band_bottom - band_top) - th) // 2 - 2
draw.text((x, y), text, fill=(255, 255, 255), font=font)

im.save(SRC, "JPEG", quality=92, optimize=True)
print(f"patched {SRC} ({im.size})")

# Also patch the assets copy used by Vite imports.
ASSET = "/dev-server/src/assets/yess-bangla-letterhead.jpeg"
import shutil; shutil.copy(SRC, ASSET)
print(f"copied → {ASSET}")
