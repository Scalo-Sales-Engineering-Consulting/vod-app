#!/usr/bin/env python3
"""UserPromptSubmit hook — the token-economist, always on.

Heuristically classifies each user prompt and injects a one-line model-tier
suggestion (Haiku/Sonnet/Opus) so the main agent routes work to the cheapest
model that fits. Output is a single short line to keep its own cost ~0.
"""
import json
import re
import sys

# IT-wide vocabulary (all roles: eng, QA, PM/PO, BA, UX, DevOps/SRE, data/ML,
# security, DBA, network/cloud, docs, support, agile, sales/solutions).
TRIVIAL = re.compile(
    r"\b(rename|typo|format|reformat|lint|grep|find|list|show|status|where is|"
    r"bump|version|chmod|print|echo|spelling|comment|"
    r"reword|tidy|tag|template|faq|reset|lookup|look up|"
    r"run the suite|restart|scale|one-?liner|fill in|update the version|"
    # Polish trivial
    r"pokaż|pokaz|lista|wylistuj|znajdź|znajdz|zmień nazwę|zmien nazwe|"
    r"literówk\w*|literowk\w*|wyświetl|wyswietl)\b", re.I)
HEAVY = re.compile(
    r"\b(architect\w*|design system|refactor|migrat\w*|security|vulnerab\w*|"
    r"concurren\w*|race condition|debug|deadlock|proration|billing|"
    r"distributed|throughput|whole app|entire|everything|cała|wszystko|"
    r"przeanaliz\w*|restructure|struktur\w*|"
    # cross-role high-stakes signals
    r"roadmap|strateg\w*|threat[- ]?model|incident|outage|root[- ]?cause|"
    r"failover|landing[- ]?zone|schema migration|gtm|go-to-market|rfp|"
    r"data model|warehouse|information architecture|prod(uction)?[- ]?critical|"
    r"high[- ]?stakes|cross-?system|cross-?team|company-?wide|org-?level|"
    # Polish high-stakes / build signals
    r"rozbuduj\w*|rozbudow\w*|zbuduj\w*|buduj\w*|zaprojektuj|projektuj|"
    r"refaktor\w*|przepisz|przepro\w*|zmigruj|migracj\w*|"
    r"wyszukiwark\w*|baz[ay] danych|backend|serwer\w*|autentykacj\w*|"
    r"płatnoś\w*|platnos\w*|bezpieczeń\w*|bezpieczen\w*|"
    r"faza \d|faz[ay]|optymalizuj\w*|wydajno\w*|"
    r"napraw\w*|błąd|blad|błęd\w*|bled\w*)\b", re.I)
# Quality-risk signals — even if routed cheap, flag for verification / no silent downgrade
QUALITY = re.compile(
    r"\b(prod\w*|produkcj\w*|płatnoś\w*|platnos\w*|payment|auth\w*|login|"
    r"hasł\w*|hasl\w*|password|token|secret|klucz|security|bezpiecz\w*|"
    r"baz[ay] danych|database|migracj\w*|migrat\w*|usuń|usun|delete|drop|"
    r"deploy|wdroż\w*|wdroz\w*|release|merge|push)\b", re.I)


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        return
    prompt = (data.get("prompt") or "").strip()
    if not prompt:
        return

    if HEAVY.search(prompt):
        tier, why = "Opus", "hard/high-stakes or broad-scope work"
    elif TRIVIAL.search(prompt) and len(prompt) < 200:
        tier, why = "Haiku", "trivial/mechanical task"
    else:
        tier, why = "Sonnet", "normal engineering (default)"

    # Quality guard: high-risk surface → never silently downgrade; verify output.
    quality = ""
    if QUALITY.search(prompt):
        if tier == "Haiku":
            tier, why = "Sonnet", "quality-critical surface (was trivial) — no silent downgrade"
        quality = (" QUALITY GUARD: touches a high-risk surface "
                   "(prod/auth/payments/data/deploy) — prioritise correctness over savings, "
                   "verify the result (tests/read-back), don't trade quality for a cheaper tier.")

    # Volume levers (tier-independent, quality-neutral): biggest real savings.
    volume = ("" if tier == "Haiku" else
              " VOLUME: grep then read only needed line ranges (not whole files); "
              "don't re-read unchanged files; reuse cached context; "
              "return diffs not full files; batch independent reads in one turn.")

    # Subscription-first: savings are quota/cap freed, not cash; act on the suggestion.
    subs = (" SUBSCRIPTION: flat-rate plan — savings = cap freed, not cash; stay within it, "
            "act on this tier (delegate to a cheaper subagent), don't pay for metered API without asking.")

    # Actionable switch — Claude Code can't switch the model from a hook, so emit the
    # exact command/subagent the operator (or main loop) can act on in one step.
    ALIAS = {"Haiku": "haiku", "Sonnet": "sonnet", "Opus": "opus"}
    WORKER = {"Haiku": "haiku-worker", "Sonnet": "sonnet-worker"}
    act = (f" ACT: if the session model is heavier than {tier}, either delegate this to the "
           f"`{WORKER[tier]}` subagent (runs on {tier}, auto), or switch the session with "
           f"`/model {ALIAS[tier]}` (needs your one-tap confirm — hooks can't switch models)."
           if tier in WORKER else
           f" ACT: this needs {tier}; keep the session on it (or `/model {ALIAS[tier]}`).")

    msg = (f"token-economist: suggested model tier = {tier} ({why}). "
           "Use the cheapest tier that MEETS THE QUALITY BAR; escalate if it risks being wrong. "
           "Delegate trivial sub-steps to Haiku agents; read only what's needed." + quality + volume + subs + act)
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "UserPromptSubmit",
            "additionalContext": msg,
        }
    }))


if __name__ == "__main__":
    main()
