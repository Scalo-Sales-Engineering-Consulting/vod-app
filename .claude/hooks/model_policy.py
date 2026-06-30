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
    "BILLING: we are on a flat-rate Claude Code subscription — savings = quota/cap freed, not cash. "
    "Always work within the subscription we already pay for; reduce demand before spending. "
    "Propose paid/metered API on top ONLY after asking, with a cost estimate (same rule as Opus).\n"
    "ACT ON IT: hooks can't switch the model — routing only saves the cap if acted on. Three ways: "
    "(1) delegate trivial work to the `haiku-worker` subagent and normal work to `sonnet-worker` "
    "(they run on their own cheap tier automatically); (2) run the session in `/model opusplan` "
    "(Opus plans, Sonnet executes — cheap hybrid); (3) `/model haiku|sonnet|opus` to switch the "
    "session yourself. Reserve the Opus session for genuinely hard tasks.\n"
    "EXPERT SUBAGENTS available (delegate to the cheapest that fits): haiku-worker (trivial/"
    "mechanical), sonnet-worker (normal engineering), token-economist (Haiku — "
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
