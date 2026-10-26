"""Write the crap4clj snapshot uml-viewer reads."""

from pathlib import Path

from codecheck.reports.edn import number_literal, string_literal
from codecheck.reports.paths import metrics_root, write_snapshot

from codecheck.crap.model import Entry


def metrics_path(root: Path) -> Path:
    return metrics_root(root) / "crap.edn"


def _edn_string(value: str) -> str:
    return string_literal(value)


def _edn_number(value: float) -> str:
    return number_literal(value)


def _edn_value(value: float | None) -> str:
    if value is None:
        return "nil"
    return _edn_number(value)


def render_edn(entries: list[Entry]) -> str:
    """EDN map `{:entries [...]}` with crap4clj's keys, in crap4clj's order.

    uml-viewer groups this file by `:namespace` and joins each operation on
    `:name`. Coverage is a percentage. `nil` coverage and CRAP mean `--no-coverage`.
    A function absent from the report is `0.0`, not `nil`.
    """

    rows = []
    for entry in entries:
        rows.append(
            "  {"
            f":name {_edn_string(entry.name)}, "
            f":namespace {_edn_string(entry.namespace)}, "
            f":complexity {entry.complexity}, "
            f":coverage {_edn_value(entry.coverage)}, "
            f":crap {_edn_value(entry.crap)}"
            "}"
        )
    body = "\n".join(rows)
    if body:
        return "{:entries [\n" + body + "\n]}\n"
    return "{:entries []}\n"


def write_metrics(entries: list[Entry], root: Path) -> Path:
    return write_snapshot(metrics_path(root), render_edn(entries))
