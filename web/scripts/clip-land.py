"""Builds web/src/shared/content/geo/arabia-land.json, the land outline of the
maps (RegionMap), from Natural Earth 1:50m land (public domain):

  curl -LO https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_land.geojson
  python3 -I web/scripts/clip-land.py ne_50m_land.geojson web/src/shared/content/geo/arabia-land.json

Each ring (outer shores and the Caspian, which Natural Earth gives as a hole
in the land) is cut to a frame a little wider than the drawn region, then
simplified (Douglas-Peucker) and rounded to two decimals of a degree.
"""
import json
import sys

BBOX = [26, 8, 64, 46]  # west, south, east, north of the region the maps may show
FRAME = [BBOX[0] - 2, BBOX[1] - 2, BBOX[2] + 2, BBOX[3] + 2]
TOLERANCE = 0.04  # degrees


def clip(ring, frame):
    west, south, east, north = frame
    edges = [
        (lambda p: p[0] >= west, lambda a, b: cross_x(a, b, west)),
        (lambda p: p[0] <= east, lambda a, b: cross_x(a, b, east)),
        (lambda p: p[1] >= south, lambda a, b: cross_y(a, b, south)),
        (lambda p: p[1] <= north, lambda a, b: cross_y(a, b, north)),
    ]
    points = ring[:-1] if ring and ring[0] == ring[-1] else ring
    for inside, cross in edges:
        if not points:
            break
        out = []
        for i, current in enumerate(points):
            previous = points[i - 1]
            if inside(current):
                if not inside(previous):
                    out.append(cross(previous, current))
                out.append(current)
            elif inside(previous):
                out.append(cross(previous, current))
        points = out
    return points


def cross_x(a, b, x):
    t = (x - a[0]) / (b[0] - a[0])
    return [x, a[1] + t * (b[1] - a[1])]


def cross_y(a, b, y):
    t = (y - a[1]) / (b[1] - a[1])
    return [a[0] + t * (b[0] - a[0]), y]


def simplify(points, tolerance):
    if len(points) < 3:
        return points
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        first, last = stack.pop()
        ax, ay = points[first]
        bx, by = points[last]
        dx, dy = bx - ax, by - ay
        length = (dx * dx + dy * dy) ** 0.5
        best, index = 0.0, None
        for i in range(first + 1, last):
            px, py = points[i]
            distance = abs(dy * px - dx * py + bx * ay - by * ax) / length if length else ((px - ax) ** 2 + (py - ay) ** 2) ** 0.5
            if distance > best:
                best, index = distance, i
        if index is not None and best > tolerance:
            keep[index] = True
            stack += [(first, index), (index, last)]
    return [p for p, k in zip(points, keep) if k]


def area(points):
    return abs(sum(points[i - 1][0] * p[1] - p[0] * points[i - 1][1] for i, p in enumerate(points))) / 2


def main(source, target):
    rings = []
    for feature in json.load(open(source))["features"]:
        geometry = feature["geometry"]
        polygons = geometry["coordinates"] if geometry["type"] == "MultiPolygon" else [geometry["coordinates"]]
        for polygon in polygons:
            for ring in polygon:
                points = simplify(clip(ring, FRAME), TOLERANCE)
                points = [[round(x, 2), round(y, 2)] for x, y in points]
                if len(points) >= 4 and area(points) > 0.01:
                    rings.append(points)
    json.dump({"bbox": BBOX, "rings": rings}, open(target, "w"), separators=(",", ":"))
    print(f"{len(rings)} rings, {sum(len(r) for r in rings)} points")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
