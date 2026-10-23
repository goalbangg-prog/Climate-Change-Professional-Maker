# Content schema v2 — write ONE JSON object to your output file

{
  "module": "<module id>",
  "lesson": {               // a plain-Korean primer for this domain, for a learner with 온실가스관리기사 background
    "title": "...",
    "summary": "2–3 sentences: what this domain is and why a consultant needs it",
    "sections": [ {"h": "heading", "body": "150–300 Korean chars, plain words; explain each term the first time"} ],   // 5–8 sections
    "terms": [ {"t": "용어", "d": "한 문장 정의 (쉬운 말)", "en": "English term"} ],   // 10–15 glossary terms
    "sources": [ {"label": "...", "url": "..."} ]
  },
  "items": [ ... 26–32 question objects ... ]
}

Question object fields (all text Korean, plain easy words, declarative "~다" style; explain jargon):
- id: "<module>-NN" (two digits, sequential)
- module: module id
- type: "mc" | "calc" | "judge"
- level: 1 (입문: 정의·구조) | 2 (실무: 적용·판단) | 3 (전문가: 예외·경계·최신 개정·교차 기준)
  → aim roughly 30% / 45% / 25%
- tags: 2–4 short Korean tags (e.g., "Scope 2", "기준연도")
- ref: official reference, short (≤ 40 chars), e.g. "GHG 프로토콜 Scope 2 지침 7장", "IFRS S1 문단 17–19"
- topic: 2–6 word label
- q: question (for level 3 use realistic consultant scenarios: "한 제조회사가 … 했다. 맞는 처리는?")
- why: 1–3 sentences explaining the correct answer with the reasoning a senior consultant would give
- trap: 1–2 sentences: the mistake a junior makes here
- sources: [{label, url}] — official/primary pages you actually opened; Big-4 / law-firm summaries acceptable as secondary. For Hyundai report facts: {"label":"현대자동차 2026 지속가능성 보고서 p.N","url":"report"}
- confidence: "high" | "medium" — omit anything lower

type "mc": options (3–4 strings, exactly one correct, distractors plausible), ans (0-based index), quote (optional ≤ 1 sentence from the standard)
type "calc": given [[label, value-string, source-label]], ans (number), tol (number), unit, dec (display decimals), steps (strings), insight (1–2 sentences). RECOMPUTE in Python before writing. Use realistic numbers; Hyundai report numbers when relevant (report text: /tmp/claude-0/-home-claude/f829a971-6193-524c-a7ea-a635bb21d323/scratchpad/dl/sr.txt, pages split by form-feed \f, page N = index N-1; pdfplumber on dl/sr.pdf also works; PDF index = printed page).
type "judge" (only when judging the Hyundai report against a requirement): look, page (int), ans "있음"|"일부"|"없음", quote (verbatim ≤ 2 sentences from that page)

Quality bar: every factual claim must come from a source you opened this session (WebSearch mode "standard"; "extended" only if thin; WebFetch the page). Today is 2026-10-22 — check for 2025–2026 revisions and say which version a question refers to when it matters. Do not invent paragraph numbers; if you can't confirm one, cite the section name instead. Keep options unambiguous. No two items may test the same fact.
