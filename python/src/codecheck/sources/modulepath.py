"""How a file path becomes the module name a snapshot is keyed by.

Python and TypeScript both derive a dotted module path from a file path, and
both carried the same three helpers to do it. They live here once; each
language keeps only its own suffix table.
"""

from __future__ import annotations


def strip_source_root(relative: str, source_root: str | None) -> str:
    """Drop the configured source root, and a leading `./`."""

    root = (source_root or "").replace("\\", "/").rstrip("/")
    if root and root != "." and relative.startswith(root + "/"):
        return relative[len(root) + 1 :]
    if relative.startswith("./"):
        return relative[2:]
    return relative


def strip_src_dir(relative: str) -> str:
    """Drop a leading `src/`, or the part before an inner `/src/`."""

    if relative.startswith("src/"):
        return relative[4:]
    if "/src/" in relative:
        return relative.split("/src/", 1)[1]
    return relative


def strip_suffix(relative: str, suffixes: tuple[str, ...]) -> str:
    for suffix in suffixes:
        if relative.endswith(suffix):
            return relative[: -len(suffix)]
    return relative
