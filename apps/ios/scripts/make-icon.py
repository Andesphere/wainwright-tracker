# Draws the placeholder app icon: three fell ridges under a low sun, on sage.
# Run from apps/ios: python3 scripts/make-icon.py
from PIL import Image, ImageDraw

S = 4096  # draw large, downsample for smooth edges
img = Image.new("RGB", (S, S))
d = ImageDraw.Draw(img)

top, bottom = (0xF4, 0xF1, 0xDE), (0xD5, 0xE2, 0xC8)
for y in range(S):
    t = y / S
    d.line([(0, y), (S, y)], fill=tuple(round(a + (b - a) * t) for a, b in zip(top, bottom)))

def ridge(points, color):
    d.polygon([(x * S, y * S) for x, y in points] + [(S, S), (0, S)], fill=color)

sun_r = 0.105 * S
cx, cy = 0.68 * S, 0.36 * S
d.ellipse([cx - sun_r, cy - sun_r, cx + sun_r, cy + sun_r], fill=(0xE3, 0xA2, 0x3B))

ridge([(0, 0.62), (0.16, 0.50), (0.30, 0.56), (0.52, 0.38), (0.64, 0.47), (0.80, 0.42), (1, 0.55)], (0x8F, 0xB5, 0x96))
ridge([(0, 0.72), (0.22, 0.56), (0.36, 0.64), (0.47, 0.60), (0.66, 0.70), (0.84, 0.58), (1, 0.66)], (0x3E, 0x6E, 0x54))
ridge([(0, 0.86), (0.20, 0.76), (0.42, 0.84), (0.62, 0.74), (0.82, 0.83), (1, 0.78)], (0x1F, 0x42, 0x32))

img.resize((1024, 1024), Image.LANCZOS).save("WainwrightsBaggers/Resources/Assets.xcassets/AppIcon.appiconset/AppIcon.png")
