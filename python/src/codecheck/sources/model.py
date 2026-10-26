"""What a language reader hands to the measuring engines."""

from dataclasses import dataclass


@dataclass(frozen=True)
class Function:
    """One parsed unit: a function or method, with its span and complexity."""

    name: str
    namespace: str
    complexity: int
    start_line: int
    end_line: int
    path: str
    language: str
    jacoco_class: str | None = None
    # UTF-8 byte span of the function. -1 when the language does not record it.
    # The mutation engine uses the span to give a nested handler the sites inside it.
    start_byte: int = -1
    end_byte: int = -1
