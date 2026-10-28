# Sessions

Parent sessions live under `sessions/<session-id>/`. A subagent session lives
under `sessions/<parent-id>/agents/<child-id>/`. The parent reads the child's
result from the tool call return value; it does not read the child's transcript.
