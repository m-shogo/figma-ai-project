#!/usr/bin/env python3
"""Validate that V3 asset map points at existing canonical rasters without rewriting them."""
import re
import sys
from os.path import dirname, abspath, join, isfile

ROOT = abspath(join(dirname(__file__), "..", "..", ".."))
ASSET_MAP = join(ROOT, "experiments", "ref001-v3", "implementation", "data", "assets.php")


def main():
    with open(ASSET_MAP, "r", encoding="utf-8") as handle:
        text = handle.read()
    paths = re.findall(
        r"'(implementation/theme/assets/images/ref001/rendered/(?:pc|sp)/[^']+\.webp)'",
        text,
    )
    if len(paths) != 32:
        print("expected 32 canonical paths, found %s" % len(paths))
        return 1
    missing = [rel for rel in paths if not isfile(join(ROOT, *rel.split("/")))]
    if missing:
        print("MISSING")
        print("\n".join(missing))
        return 1
    print("OK canonical rasters=%s" % len(paths))
    return 0


if __name__ == "__main__":
    sys.exit(main())
