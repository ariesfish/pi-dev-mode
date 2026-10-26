"""Which reader owns which language.

One entry per language: the module that turns a source file into the functions
the CRAP and mutation engines measure. Adding a language means one `lang_*.py`
module and one row here.
"""

from __future__ import annotations

from codecheck.sources.model import Function
from codecheck.sources.languages.clojure import functions_in_source as clojure_functions
from codecheck.sources.languages.go import functions_in_source as go_functions
from codecheck.sources.languages.java import functions_in_source as java_functions
from codecheck.sources.languages.python import functions_in_source as python_functions
from codecheck.sources.languages.rust import functions_in_source as rust_functions
from codecheck.sources.languages.typescript import functions_in_source as typescript_functions

_READERS = {
    "clojure": clojure_functions,
    "java": java_functions,
    "go": go_functions,
    "typescript": typescript_functions,
    "python": python_functions,
    "rust": rust_functions,
}


def functions_in_file(language: str, source: str, path: str, project_root: str) -> list[Function]:
    reader = _READERS.get(language)
    if reader is None:
        return []
    return reader(source, path, project_root)


def languages() -> list[str]:
    """Every language this package can read, in a stable order."""

    return sorted(_READERS)
