"""Gap detection — regex-based signal scoring on conversation turns."""

import re

FALLBACK_PATTERNS = [
    r"i (don't|do not|can't|cannot) (help|answer|provide|access|assist with)",
    r"(outside|beyond) my (knowledge|scope|capabilities|training)",
    r"please (contact|reach out to|check with|consult) (support|us|our team|a human|an agent)",
    r"i('m| am) (not sure|uncertain|unable|afraid i can't|sorry,? (but )?i can't)",
    r"(i'd|i would) (recommend|suggest) (reaching out|contacting|speaking with|checking)",
    r"(my|based on my) (knowledge|training|information) (doesn't|does not|is limited|doesn't cover)",
    r"i don't have (access to|information (about|on)|that|those details)",
    r"(unfortunately|regrettably).{0,40}(can't|cannot|unable|don't|do not)",
    r"that('s| is) (outside|beyond|not something) (my|what i)",
    r"i('m| am) not (able|equipped|trained) to",
]

_compiled = [re.compile(p, re.IGNORECASE) for p in FALLBACK_PATTERNS]


def score_gap(turns: list[dict]) -> bool:
    """Return True if any assistant turn matches a fallback/failure pattern."""
    for turn in turns:
        if turn.get("role") != "assistant":
            continue
        content = turn.get("content", "")
        for pattern in _compiled:
            if pattern.search(content):
                return True
    return False
