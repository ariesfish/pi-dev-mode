"""The three measuring engines behind `scripts/check-code.sh`, as one package.

crap    cyclomatic complexity x coverage -> CRAP per function
dry     structural duplication (Jaccard similarity of normalized forms)
mutate  mutation testing: survivors are assertions the tests never made

Each engine keeps upstream's module layout under its own subpackage. What the
three used to duplicate - the source walker, the tree-sitter helpers, the EDN
reader, the report loader, the snapshot path - lives once at package level.
"""

__all__ = ["crap", "dry", "mutate"]
