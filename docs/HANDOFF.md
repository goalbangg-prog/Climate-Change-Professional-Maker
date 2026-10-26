# 인수인계 · 원문 읽기 사이트

작성 2026-10-26 · 새 대화에서 이 문서를 먼저 읽고 시작한다.

---

## 0. 새 대화 첫 메시지 (복사해서 쓰기)

```
goalbangg-prog/Climate-Change-Professional-Maker 저장소의 docs/HANDOFF.md와 docs/DEFINITION-v5.md를 먼저 끝까지 읽어.
그다음 [IFRS / GHG 프로토콜 / 배출권거래제 / 목표관리] 확장팩을 검수해 줘. PDF는 첨부했어.
```

## 1. 이 사이트가 뭔지 (한 줄)

김수현이 기후·온실가스 기준서를 **원문 PDF로 하나씩 읽는** 개인 읽기 공간. 채용 담당자에게는 진도와 기록이 공개된다.

- 사이트: https://goalbangg-prog.github.io/Climate-Change-Professional-Maker/reading/
- 유일한 기준: `docs/DEFINITION-v5.md` (정의서). 정의서에 없는 기능은 **만들기 전에 묻는다.**

## 2. 사용자와 일하는 법

- 반말, 쉬운 단어. 어려운 용어는 풀어서 말한다.
- 결정은 사용자가 한다. 질문은 한 번에 몇 개만, 선택지를 붙여서.
- 사실만 쓴다. 쪽수·문단·숫자는 PDF에서 확인한 것만. 모르면 모른다고 말한다.
- AI가 쓴 글은 화면에 "AI 초안"이라고 표시한다. 용어집에는 AI 설명을 넣지 않는다(원문 정의만).
- 깃허브에 올릴지는 사용자에게 확인한다. 올릴 때 커밋 작성자는 `goalbangg-prog <goalbangg@gmail.com>`, `git push origin HEAD:main`.
- 테스트 스크립트와 스크린샷은 저장소 밖(임시 폴더)에 둔다.

## 3. 파일 구조

```
reading/
  index.html, app.js, style.css    사이트 (서버 없음, 해시 주소)
  packs.json                       분야 4개 + 꽂힌 확장팩 목록
  packs/<id>/pack.json             확장팩 하나 = 기준서 하나
  packs/<id>/pdf/<doc>.pdf         원문 PDF
  glossary.json                    용어집 (원문 정의만)
  log/public.json                  공개 기록 (사용자가 내보낸 파일)
  vendor/pdfjs/                    pdf.js 3.11.174 (원문을 직접 그림)
data/books/*.json                  예전 리딩 클래스 회차 데이터 (목차 나누기 재료)
docs/DEFINITION-v5.md              정의서
```

화면 주소: `#/` 서재 · `#/p/<pack>` 목차 화면 · `#/p/<pack>/read/<item>` 읽기(1 지도 → 2 원문 → 3 궁금한 점) · `#/terms` 용어집 · `#/notes` 내 기록

## 4. 데이터 형식

**packs.json**
```json
{ "categories": [{ "id": "report|rating|climate|ghg", "label": "...", "desc": "...", "candidates": ["..."] }],
  "packs": [{ "id": "kssb", "path": "packs/kssb/", "category": "climate" }] }
```

**pack.json**
```json
{ "id": "kssb", "code": "KSSB", "name": "...", "kind": "공시기준", "edition": "...", "issuer": "...",
  "status": "ready | prep",
  "schedule": [{ "from": 1, "to": 2, "label": "..." }],
  "docs": { "kssb-1": { "short": "제1호", "name": "...", "file": "pdf/kssb-1.pdf", "pages": 142, "url": "공식 링크",
            "glossary": { "label": "부록 A 용어의 정의", "start": 30, "end": 32 }, "lang": "en (영어 원문일 때만)" } },
  "parts": [{ "id": "s1", "label": "제1호 · 일반 요구사항" }],
  "items": [{
    "id": "k1-3", "doc": "kssb-1", "part": "s1", "title": "중요성과 보고기업",
    "map": "위치 안내 한두 문장 (해설·요약 아님)",
    "ranges": [{ "doc": "kssb-1", "kind": "본문|적용지침|부록|결론도출근거", "label": "문단 17~20", "start": 9, "end": 10, "by": "문단 19 (적용지침일 때 가리키는 본문)" }],
    "refs":   [{ "doc": "...", "label": "...", "start": 0, "end": 0, "by": "..." }],
    "guide":  [{ "doc": "...", "page": 9, "label": "문단 17 · 한 줄 제목", "terms": [["영어", "한국어"]], "ko": "쉬운 풀이" }],
    "guideChecked": false
  }] }
```
- `ranges`는 진도에 들어가는 읽을 곳, `refs`는 다른 항목에서 이미 읽는 곳(참고만).
- 쪽 번호는 **PDF 파일의 쪽 순서**(뷰어의 page=)다. 인쇄 쪽 번호와 다를 수 있으니 반드시 확인한다.
- `status: "prep"` 확장팩은 목차만 보이고 읽기 버튼이 없다. 항목에 `rangeText`(예전 범위 글), `pagesDraft`(검수 전 쪽)가 있다.
- `guide`는 영어 원문(`lang: "en"`)일 때만 원문 오른쪽에 뜬다.

**glossary.json** — `{ note, checked, terms: [{ t, en, def(원문 그대로), cats: ["climate", ...], src: { pack, doc, page, label } }] }`

**브라우저 저장(localStorage `reading-v1`)** — `{ version, lastBackup, packs: { <pack>: { startedAt, items: { <item>: { done, doneAt, qs: [{ q, a, ref, at }] } } } } }`
(예전 `note`, `tree`, `cases`가 남아 있을 수 있다. 지우지 않는다.)

**log/public.json** — 내 기록 화면의 "공개용 파일 받기"로 만든 파일. `{ owner, updated, packs: { <pack>: { startedAt, items: { <item>: { done, doneAt, qs } } } } }`

## 5. 확장팩 검수 방법 (KSSB에서 쓴 방법)

목표: `prep` → `ready`. 원문을 빠짐없이, 한 번씩, 맞는 쪽으로.

1. **PDF 넣기:** `reading/packs/<id>/pdf/<doc>.pdf`. 파일 이름은 pack.json의 `docs.<doc>.file`과 맞춘다.
2. **쪽마다 글자 뽑기:** `pdftotext -f N -l N -layout` (임시 폴더에). 판본·발행일을 표지에서 확인한다.
3. **쪽 번호 확인:** PDF 아래 찍힌 쪽 번호와 파일 쪽 순서가 같은지 본다. 다르면 파일 쪽 순서를 쓴다.
4. **문단 위치 찾기:** 줄 앞의 문단 번호(예: `17`, `B13`, `제9조`)로 각 문단이 시작하는 쪽을 찾는다. 항목 범위의 끝 쪽은 "다음 문단이 시작하는 쪽"이다. 그 쪽 맨 위에서 다음 문단이 시작하면 한 쪽을 뺀다.
5. **본문 항목 나누기:** `data/books/<book>.json`의 회차를 재료로 쓰되, **원문이 아닌 항목**(기업 보고서 읽기, 한국 적용 같은 것)은 빼거나 사용자에게 묻는다. 원래 목차 순서를 지킨다.
6. **적용지침(부록 B 등) 배정:** 본문에서 "문단 B○○을 적용한다/참조"를 전부 뽑아, 가리키는 본문 항목에 붙인다(`by`에 가리키는 문단). 이미 다른 항목에 붙은 걸 또 가리키면 `refs`로 둔다.
7. **빠짐·중복 검사:** 적용지침 문단 번호를 전부 세어 **모두 정확히 한 번씩** 배정됐는지 코드로 확인한다. (KSSB: 제1호 B1~B59 59개, 제2호 B1~B71 73개)
8. **다른 문서를 가리키는 참조 확인:** "제1호 문단 B42"처럼 다른 문서를 가리키면 그 문서 쪽으로 연결한다. (KSSB 제2호 문단 7·26 → 제1호 B42였다)
9. **지도 문장:** 항목마다 "이 부분이 무엇을 정하는 곳인지" 위치 안내 한두 문장. 해설·요약을 쓰지 않는다.
10. **용어집:** 그 기준서의 정의 조항(부록 A, Glossary, 고시 제2조)을 원문 그대로 `glossary.json`에 넣는다. 줄바꿈만 이어 붙이고, **넣은 뒤 `pdftotext -raw` 글자와 공백 빼고 비교해서 100% 일치**를 확인한다. 분야(`cats`)를 붙인다.
11. **영어 원문이면:** `docs.<doc>.lang = "en"`, 항목마다 `guide`를 쓴다(문단별 한 줄 제목, 핵심 용어 영↔한, 무엇을 요구하는지 쉬운 풀이). 번역문 전체를 쓰지 않는다. 사용자가 읽을 차례인 항목부터 몇 개씩 쓴다. 원문과 대조했으면 `guideChecked: true`.
12. `status: "ready"`로 바꾸고 화면을 테스트한다.

## 6. 테스트

```
cd reading && python3 -m http.server 8766      # 백그라운드로
```
Playwright(파이썬)로 1440px·390px 캡처. Pretendard(jsdelivr)는 막혀 있으니 `page.route("**/cdn.jsdelivr.net/**", abort)`. 확인할 것: 콘솔 에러 0, 가로 스크롤 없음(scrollWidth), 읽기 → 다 읽었어요 → 새로고침 후 남아 있음. 헤드리스 크롬은 PDF를 그리므로(pdf.js) 원문 캡처가 된다.

## 7. 남은 일 (우선순위)

1. 사용자가 KSSB를 실제로 읽으며 나온 불편 고치기
2. **배출권거래제(K-ETS) 고시 2종, 목표관리 고시 검수** — 한국어라 길잡이가 필요 없고 정의 조항(제2조)이 많아 용어집도 채워진다. 별표 PDF도 필요.
3. **IFRS S1·S2 검수** — KSSB 다음에 읽을 기준서. 영어 원문이라 길잡이를 읽는 순서대로 조금씩. IFRS 재단 저작물이라 PDF 공개는 사용자와 다시 확인한다.
4. GHG 프로토콜 3종 검수 + 길잡이 (쪽수가 "인쇄 쪽" 기준이라 PDF 쪽과 다를 수 있음, 원문 아닌 항목 정리 필요)
5. 공개 기록: 사용자가 일주일에 한 번 `public.json`을 주면 `reading/log/public.json`으로 올린다.
6. 지속가능경영보고·ESG 평가 분야는 원문이 정해지면(GRI, CDP 질의서 등) 확장팩으로 만든다.

## 8. 알아 둘 것

- 확장팩 `ifrs`, `ghgp`, `kets`, `tms`는 예전 회차를 옮긴 **목차 준비** 상태다. 쪽수는 검수 전이라 화면에 쓰지 않는다.
- KSSB의 `k0`(들어가며)는 원문으로는 부록 E 문단 E1(59쪽)만 읽는다. 사용자가 원본 유지를 원해 항목으로 남겼다.
- 예전 리딩 클래스(`src/reading.html`, 루트 `index.html`)와 `proto/` 시안은 건드리지 않는다.
- 색: 초록 #2E7D32(주색) · 파랑 #2F5D80(정보) · 주황갈색 #A9562E(주의), 바탕 흰색. SQLD양파 사이트 톤. 확장팩마다 색을 바꾸지 않고 약어 배지로 구분한다.
