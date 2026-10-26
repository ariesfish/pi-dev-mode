"""Rows of the CRAP report."""

from dataclasses import dataclass


@dataclass(frozen=True)
class Entry:
    """One row of the CRAP report and of `.metrics/crap.edn`."""

    name: str
    namespace: str
    complexity: int
    coverage: float | None
    crap: float | None
    path: str
    language: str
