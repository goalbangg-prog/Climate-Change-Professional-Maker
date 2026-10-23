# 교재 집필 브리프 (track별 작업자용). 오늘은 2026-10-23.

읽을 것: data/TEXTBOOK_SCHEMA.md (규격), data/courses.json (너의 track의 chapters: id·name·goal이 목차다. chapter id를 그대로 쓴다), data/modules/<module>.json의 lesson·items (기존 입문 글·문항 — 참고하되 복사하지 말고, 업무 흐름 순서로 다시 쓴다), data/companies/kia.json과 scratchpad의 co/kia.txt(기아 보고서 160쪽 텍스트, \f로 쪽 구분, index i = 쪽 i+1), dl/sr.txt(현대차 보고서, index i = 쪽 i+1).

쓸 것: data/textbook/<track>.json 하나. chapters 순서와 id는 courses.json과 같게. '기초 다지기'(id *-0) 장은 Scope가 뭔지 모르는 독자용 4~5페이지: 온실가스 종류와 GWP, Scope 1·2·3, 기준연도와 재산정, 공시 기준이 왜 여러 개인가(IFRS·KSSB·ESRS·GRI), 그리고 그 track이 하는 일 한 장.

품질 기준
- 업무 흐름: 각 장 첫 페이지는 "이 단계에서 신입이 실제로 받는 일"로 시작한다 (요청 → 할 일 → 산출물).
- 개념 흐름이 끊기지 않게: 예) LCA는 목표·범위 → 기능단위 → 시스템 경계 → 컷오프 → 할당 → LCI → LCIA(특성화·정규화·가중치) → 해석(민감도·불확실성) → 보고(ISO 14067·EPD·비교 주장) → Scope 3·CBAM·배터리 규정 연결.
- 실제 예: 두 보고서의 숫자·문장(쪽 번호)과 기준서 문단을 든다. 없는 숫자를 만들지 않는다.
- 모든 사실은 이 세션에서 연 공식 자료(WebSearch "standard" → WebFetch)로 확인. 열지 못한 것은 "(2차 자료 기준)" 표시 또는 생략.
- 분량: 장당 4~7페이지, 페이지당 900~1,600자. 전체 6~8장이면 30~45페이지.
- 검증: 쓰고 나서 python3 -I로 JSON 파싱, 각 페이지 body 글자 수, check의 ans 범위, chapter id 일치를 검사하고 결과를 보고한다.
- 마지막 보고 ≤ 200자: 장·페이지 수, 확인 못 해 2차 자료로 쓴 항목, 빠뜨린 것.
