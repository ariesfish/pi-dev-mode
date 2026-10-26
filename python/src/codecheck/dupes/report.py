"""Text and EDN reports. The text layout matches dry4clj."""

from __future__ import annotations

from pathlib import Path

from codecheck.reports.edn import number_literal, string_literal
from codecheck.reports.paths import metrics_root, write_snapshot

from codecheck.dupes.model import Duplicate


def format_text(candidates: list[Duplicate]) -> str:
    if not candidates:
        return "No duplicate candidates found.\n"
    blocks = []
    for candidate in candidates:
        left = candidate.left
        right = candidate.right
        blocks.append(
            f"DUPLICATE score={candidate.score:.2f}\n"
            f"  {left.file}:{left.start_line}-{left.end_line}\n"
            f"  {right.file}:{right.start_line}-{right.end_line}"
        )
    return "\n\n".join(blocks) + "\n"


def _edn_string(value: str) -> str:
    return string_literal(value)


def _edn_float(value: float) -> str:
    return number_literal(value, 12)


def _span_edn(span) -> str:
    return (
        f"{{:file {_edn_string(span.file)}, "
        f":start-line {span.start_line}, :end-line {span.end_line}}}"
    )


def _candidate_edn(candidate: Duplicate) -> str:
    return "\n".join(
        [
            f" {{:score {_edn_float(candidate.score)}",
            f"  :language {_edn_string(candidate.language)}",
            f"  :left {_span_edn(candidate.left)}",
            f"  :right {_span_edn(candidate.right)}",
            f"  :left-nodes {candidate.left_nodes}",
            f"  :right-nodes {candidate.right_nodes}}}",
        ]
    )


def render_edn(candidates: list[Duplicate]) -> str:
    """EDN map `{:candidates [...]}` with dry4clj's keys, plus `:language`."""

    if not candidates:
        return "{:candidates []}\n"
    rows = [_candidate_edn(candidate) for candidate in candidates]
    return "{:candidates [\n" + "\n".join(rows) + "\n]}\n"


def metrics_path(root: Path) -> Path:
    return metrics_root(root) / "dry.edn"


def write_metrics(candidates: list[Duplicate], root: Path) -> Path:
    return write_snapshot(metrics_path(root), render_edn(candidates))
