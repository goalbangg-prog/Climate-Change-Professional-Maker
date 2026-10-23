# 교재 독립 검수 브리프 (2026-10-24)

당신은 원고를 쓰지 않은 검수자다. 목표: 신입이 이 교재를 믿고 읽어도 되게 만드는 것.

## 확인할 것 (블록마다)
1. **사실**: 해설·req·summary·write.model·check.why의 모든 주장이 원문 문단과 맞는가. 특히 "~해야 한다(의무)"와 "~할 수 있다(선택)"를 바꿔 쓰지 않았는가. 조건부 요구를 무조건처럼 쓰지 않았는가.
2. **문단 번호**: no, pdfPage, 본문에 언급한 문단 번호가 원문의 그 내용과 맞는가.
3. **인용**: quote가 원문 그대로인가(띄어쓰기·줄바꿈 차이는 무시), 2문장 이하인가.
4. **예시**: ex의 숫자·문장이 보고서 그 쪽에 실제로 있는가.
5. **채점**: write.model이 must 묶음을 모두 포함하는가, must가 원문 핵심과 맞는가, check.ans가 맞는가.
6. **읽기**: 신입이 처음 보는 어려운 말이 풀이 없이 나오는가(있으면 쉬운 말로 고친다). 문장이 '~다.'로 끝나는가.

## 원문 위치 (scratchpad = /tmp/claude-0/-home-claude/f829a971-6193-524c-a7ea-a635bb21d323/scratchpad)
- KSSB 제1호 `scratchpad/kssb/k1.txt`, 제2호 `scratchpad/kssb/k2.txt`
- IFRS S2 2023 `scratchpad/ifrs/s2.txt`, 2025 개정 `scratchpad/ifrs/amend.txt`, TPT `scratchpad/ifrs/tpt.txt`
- 기아 `scratchpad/co/kia.txt`, 현대차 `scratchpad/dl/sr.txt`, BMW/벤츠/포르쉐 `scratchpad/co/*.txt`
- 모두 pdftotext -layout, 쪽은 \f로 구분, index i = 쪽 i+1

## 고치는 규칙
- 근거가 분명한 오류만 JSON에서 직접 고친다. 고칠 때는 원문 근거를 확인한 뒤에만.
- 판단이 갈리거나 확인할 수 없는 것은 고치지 말고 보고서에 "확인 필요"로 남긴다.
- 형식(필드 이름, id, 블록 순서)은 바꾸지 않는다. JSON은 `json.dump(..., ensure_ascii=False, indent=1)`로 저장한다.
- 끝나면 python3 -I로: JSON 파싱, model⊇must, check.ans 범위, 블록 no가 원문에 있는지 다시 검사.

## 보고서
`data/books/REVIEW-<책>.md`에 남긴다: 고친 것(회차·블록·전→후·근거 문단), 확인 필요 목록, 전체 평가(신입이 믿고 읽어도 되는 수준인가, 가장 약한 회차 3개).
최종 응답은 200자 이내 요약.
