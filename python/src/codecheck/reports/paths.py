"""Where things live: the snapshot directory, and the nearest project file.

`CODE_CHECK_METRICS_DIR` moves the directory; the default stays `.metrics` so a
snapshot produced by `check-code.sh` still reads with uml-viewer.
"""

from __future__ import annotations

import os
from pathlib import Path


def metrics_root(root: Path) -> Path:
    override = os.environ.get("CODE_CHECK_METRICS_DIR")
    if not override:
        return root / ".metrics"
    path = Path(override)
    return path if path.is_absolute() else root / path


def nearest(start: Path, marker: str, stop: Path) -> Path | None:
    """The closest ancestor of `start` holding `marker`, never above `stop`.

    Coverage and test commands run from here: a crate root, a go.mod, a
    package.json, a pom.xml.
    """

    current = start if start.is_dir() else start.parent
    stop = stop.resolve()
    while True:
        if (current / marker).is_file():
            return current
        if current == stop or current.parent == current:
            return None
        current = current.parent


def write_snapshot(path: Path, text: str) -> Path:
    """Write one snapshot, creating the directory the first time."""

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
    return path
