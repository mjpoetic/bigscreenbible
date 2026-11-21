"""Prepare approved line art and an edge-to-edge region map (requires Pillow)."""
import json
import sys
from collections import Counter, deque
from pathlib import Path

from PIL import Image, ImageFilter, ImageOps

source, destination = map(Path, sys.argv[1:3])
destination.mkdir(parents=True, exist_ok=True)
size = 600

with Image.open(source) as image:
    rgba = image.convert("RGBA")
    white = Image.new("RGBA", rgba.size, "white")
    white.alpha_composite(rgba)
    gray = ImageOps.grayscale(white).resize((1200, 1200), Image.Resampling.LANCZOS)

lines = Image.new("RGBA", gray.size)
lines.putalpha(ImageOps.invert(gray))
lines.save(destination / "jesus-welcomes-children.png", optimize=True)

small = gray.resize((size, size), Image.Resampling.LANCZOS)
barrier = small.point(lambda value: 255 if value < 210 else 0)
labels = [0] * (size * size)
region = 0


def neighbors(pixel):
    x, y = pixel % size, pixel // size
    if x > 0:
        yield pixel - 1
    if x < size - 1:
        yield pixel + 1
    if y > 0:
        yield pixel - size
    if y < size - 1:
        yield pixel + size


def components(blocked):
    visited = bytearray(blocked.tobytes())
    for start in range(len(visited)):
        if visited[start]:
            continue
        visited[start] = 1
        queue = deque([start])
        component = []
        while queue:
            pixel = queue.popleft()
            component.append(pixel)
            for adjacent in neighbors(pixel):
                if not visited[adjacent]:
                    visited[adjacent] = 1
                    queue.append(adjacent)
        yield component


# The widened lines close small gaps. Keep even single-pixel interiors.
for component in components(barrier.filter(ImageFilter.MaxFilter(3))):
    region += 1
    for pixel in component:
        labels[pixel] = region

# Recover narrow enclosed spaces that disappeared when the lines were widened.
for component in components(barrier):
    if any(labels[pixel] for pixel in component):
        continue
    region += 1
    for pixel in component:
        labels[pixel] = region

# Spread the nearest labels all the way to the center of each contour. Ink
# reaches the antialiased edge while the original black line art stays on top.
queue = deque(pixel for pixel, label in enumerate(labels) if label)
while queue:
    pixel = queue.popleft()
    for adjacent in neighbors(pixel):
        if not labels[adjacent]:
            labels[adjacent] = labels[pixel]
            queue.append(adjacent)

if not all(labels):
    raise ValueError("No colorable regions found")
rgb = bytes(channel for label in labels for channel in (label & 255, label >> 8, 127))
Image.frombytes("RGB", (size, size), rgb).save(destination / "jesus-welcomes-children-regions.png", optimize=True)
counts = Counter(labels)
metadata = {
    "width": size,
    "height": size,
    "regions": region,
    "minRegionPixels": min(counts.values()),
    "source": "Original AI-generated illustration approved by the project owner.",
    "regionSizes": [counts[label] for label in range(1, region + 1)],
}
(destination / "jesus-welcomes-children.json").write_text(json.dumps(metadata, indent=2) + "\n")
print(f"{region} colorable regions covering {sum(counts.values())} pixels prepared")
