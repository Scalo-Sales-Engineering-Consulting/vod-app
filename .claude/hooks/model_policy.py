#!/usr/bin/env python3
"""SessionStart hook — inject the model-routing / cost policy once per session
(cheaper than reminding on every prompt) plus the expert-agent roster."""
import json

POLICY = (
    "MODEL/COST POLICY (token economy): default to Sonnet. Use Haiku for trivial/mechanical "
    "work (renames, greps, status, boilerplate, single-file lookups). Reserve Opus for genuinely "
    "hard or high-stakes-and-urgent work (deep architecture, gnarly debugging, security-critical "
    "reasoning). When unsure, pick the cheaper tier and escalate only if it fails. Read only what "
    "you need; avoid re-reading unchanged files; batch independent lookups.\n"
    "EXPERT SUBAGENTS available (delegate to the cheapest that fits): token-economist (Haiku — "
    "'which model for X?'), ux-designer, product-manager, product-owner, qa-automations, "
    "code-quality-guardian (run after code changes / before merge)."
)


def main():
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "SessionStart",
            "additionalContext": POLICY,
        }
    }))


if __name__ == "__main__":
    main()
