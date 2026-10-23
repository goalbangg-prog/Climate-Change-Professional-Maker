# Company pack brief (Korean study content). Today is 2026-10-23.

Goal: judge ONE automaker's FY2025 report against a fixed question list, so four companies (Hyundai already done; Kia, BMW, Mercedes-Benz, Porsche) can be compared side by side.

Inputs
- Report text: /tmp/claude-0/-home-claude/f829a971-6193-524c-a7ea-a635bb21d323/scratchpad/co/<company>.txt  (pdftotext -layout; pages split by form-feed \f; text index i = PDF page i+1). The PDF itself: co/<company>.pdf (pdfplumber works for tables). IMPORTANT: the PDF page index may differ from the printed page number — record BOTH: `page` = PDF page index (1-based, for #page= links), `printed` = the printed page number if visible.
- Hyundai-based question list (71 rows): /tmp/claude-0/-home-claude/f829a971-6193-524c-a7ea-a635bb21d323/scratchpad/out/판정질문목록_현대차기준.csv  — columns 기준·조항, 주제, 질문. Use the SAME questions (same wording where the question is about the report; drop "현대자동차" and write the company name).

Output: ONE JSON object to /tmp/claude-0/-home-claude/f829a971-6193-524c-a7ea-a635bb21d323/scratchpad/co/<company>.json
{
 "company": "<id: kia|bmw|mb|porsche>", "name": "<Korean display name>", "report": "<report title, year, language>", "pages": <int>,
 "framework": "<which standards the report follows, e.g. 'ESRS(CSRD) + GRI + TCFD'>",
 "profile": {"scope1":..., "scope2_loc":..., "scope2_mkt":..., "scope3":..., "unit":"tCO2e", "year":"FY2025", "targets":"...", "assurance":"...", "icp":"...", "pay_link":"..."},   // headline facts with page refs in a "src" sub-object {field: page}
 "judge": [ 30–45 objects ],
 "calc": [ 8–12 objects ],
 "notes": "3–5 sentences: what this report does notably better/worse than a typical Korean report; which questions did not apply and why"
}

judge object: {id:"<company>-jNN", key:"<stable key from the question list, e.g. 's2-29a-i', 's2-29g', 'esrs-e1-6-scope2', 'gri-2-3'>", ref, topic, q, look, page, printed, ans:"있음"|"일부"|"없음"|"해당 없음", quote (verbatim ≤2 sentences, original language; if German/English add a short Korean gloss in `gloss`), why, trap, level (1–3), tags}
- Use "해당 없음" when the question targets a framework the company does not claim to follow (e.g. KSSB-specific questions for a German company, SASB index when none exists) — but still say in `why` what the closest equivalent disclosure is.
- Keep the `key` identical across companies so the app can line them up. Keys for the Hyundai list (use these exact keys): s2-29a-i 총배출량, s2-gases 7대 온실가스, s2-29a-ii 측정기준, s2-gwp GWP, s2-29a-iii 측정방법, s2-29a-iv 연결실체구분, s2-29a-v Scope2 지역기반, s2-29a-vi Scope3 범위, s1-restate 전년도 재산정, s2-29f ICP, s2-29g 보상비율, s2-33 목표요소, s2-34a 목표검증, s2-35 목표성과, s2-36c 총량순량, s2-36e 크레딧, assur-level 보증수준, s2-6a-v 보상정책, s2-10d 시간범위, s2-25a-iv 우선순위, s2-16 당기재무영향, s2-22 시나리오, s2-29c 물리위험자산, esrs-dm 이중중대성, esrs-e1-6-scope2 Scope2 두방식, esrs-e1-8-icp ICP범위, gri-2-3 보고기간, gri-omission 생략사유, gri-305-2 Scope2방식, sasb-410a2 ZEV판매, cdp-index CDP문항, ecovadis 공급망평가, ratings-use 평가지표활용, kssb-method 측정방법별, kssb-icp ICP선택공시, kssb-horizon 시간범위정의, s1-compliance ISSB준수선언, s1-entity 보고실체, s1-timing 동시공시, assur-scope 검증범위, practice-boundary 보고경계, practice-restate 재작성공시, practice-contact 문의처, practice-index 색인표, ghgp-boundary 조직경계, ghgp-cat15 Cat15, targets-sbti SBTi, targets-interim 중간목표, lca-method LCA방법, scenario-tools 시나리오도구, physical-assets 물리노출자산, korea-ets 배출권거래제언급, markets-cbam CBAM언급. (Add others with a clear key if the report has notable extra disclosures.)

calc object: {id:"<company>-cNN", key:"c-<topic>", topic, q, given:[[label,value,"p.N"]], ans, tol, unit, dec, steps[], insight, why, trap, level}. Use the SAME calc topics as Hyundai where numbers exist: 지역기반 합계, 전년대비 감축률, 2030 목표배출량, 목표 진척률, Scope2 지역-시장 차이, Cat.11(use-phase) 비중, Scope3 합계 검산, ICP 비용감각, 보증 비율; plus 1–3 company-specific ones. Recompute every calc in Python before writing.

Rules: every quote verbatim from the text file (two-column layouts may split lines; fine); every page verified; plain Korean (~다 style) for q/why/trap; do not invent numbers; if a number cannot be found say so in `why` and use "없음"/"일부". Final reply ≤ 200 words: counts, 5 headline facts with pages, questions marked 해당 없음 and why.
