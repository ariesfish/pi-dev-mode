"""The review gate: thresholds over the three measurements.

`scripts/check-code.sh` bootstraps the runtime and then hands every decision to
this package, so the gate's rules live in one testable place instead of a bash
script:

  plan      what coverage command each language needs here
  collect   which files a run measures
  run       the three passes over those files
  verdict   pass / threshold / broken / unmeasured, and the ratchet
  evidence  the artefact a review verdict cites
"""

from __future__ import annotations
