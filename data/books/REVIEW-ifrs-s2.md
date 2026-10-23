# 검수 보고서: IFRS S2 교재 (ifrs-s2.json, s2-0~s2-11)

검수일 2026-10-24. 대조한 원문: IFRS S2 2023 `ifrs/s2.txt`, 2025년 12월 개정 `ifrs/amend.txt`(개정 본문, C1A~C6, 개정 BC), TPT 매핑 `ifrs/tpt.txt`, KSSB 제2호 `kssb/k2.txt`(kssb·diff 대응 확인), BMW `co/bmw.txt`.
모든 quote(32개), 블록 no와 pdfPage, kssb·diff 표지(46개 블록), 인용된 개정 BC(BC80A·BC88·BC97A~D·BC121H~J·BC164A·BC176)와 KSSB BC(BC2·7·125~129·144·149~151·155·161·175·179), TPT 대응 번호, BMW 99·131쪽을 대조했다.

## 1. 고친 것

| 회차·블록 | 전 | 후 | 근거 |
|---|---|---|---|
| s2-11 · C6 | quote가 "An entity shall apply the amendments listed in paragraph C1A … 1 January 2027."로, C6이 아닌 C1B 문장이었음 | C6 첫 문장 "If an entity previously applied IFRS S2, … adjust comparative information for the preceding period as follows:" | amend.txt 13쪽 C1B·C6 |
| s2-0 · ISSB | pdfPage 3 (저작권 쪽) | pdfPage 5 | "IFRS S2 … is set out in paragraphs 1–37 and Appendices A–C. All paragraphs have equal authority."는 s2.txt 5쪽(머리말)에 있다 |
| s2-5 · 19 (prose 1번째) | "두 문단 모두 '판단한 경우'라고 해서…" | "문단 19는 '기업이 판단한 경우'라고 쓰고 문단 21은 그렇게 판단한 기업에 설명을 요구하므로…" | 원문에서 'determines'는 19와 21에만 있다. 20은 "if the entity does not have the skills…"라는 조건만 둔다 |
| s2-3 · write.wrong | "KSSB는 기간범위를 설명하지 않아도 된다는 규정이 없다" (이중 부정이라 무엇이 틀린 것인지 알기 어려움) | "KSSB 10B의 기본 기간을 쓰는 기업도 10⑷의 정의 설명을 따로 해야 한다" | KSSB 10B 마지막 문장: 10⑷ 공시 대신 기준서 기간을 썼음을 공시한다 |
| s2-8 · 29A (prose 3번째) | "GICS 6자리 코드" | "GICS(글로벌 산업분류기준) 6자리 코드" | 브리프 6(어려운 말 풀이). amend B62(a)(i) |
| s2-3 · 10(d) (prose 3번째) | "유럽 ESRS 기준으로" | "유럽 지속가능성 보고 기준(ESRS)으로" | 브리프 6 |

형식은 바꾸지 않았다(블록의 doc·amend2025 필드 포함). 저장은 `json.dump(..., ensure_ascii=False, indent=1)`로 했다.

## 2. 확인한 핵심 쟁점 (오류 없음)

- **29(a)(ii)·B24**: 2023년 원문 B24는 "is permitted to use this method"로 선택이다. 개정 후에는 "in whole or in part"가 들어갔고, 그 부분에만, 요구가 적용되는 동안만 쓸 수 있다(amend 5·8쪽, BC97B). 교재 설명이 정확하다. B21~B22의 GWP 완화와 B28의 "for each alternative method"도 맞다.
- **KSSB 29⑴㈒ 대 IFRS S2**: 개정 C1A 목록과 개정 본문 어디에도 방법별 세분화 문단이 없다. BC97D는 S1 B29~B30에 따라 "중요하다면" 나눈다고만 설명한다. 교재의 "KSSB는 명시적 요구, IFRS S2는 BC에서 S1 원칙"이라는 구분이 정확하다.
- **29A~29C**: 29A는 선택("is permitted"), 29B(a)(b)는 한정했을 때 의무, 29C는 카테고리 15를 포함하면 의무다. 공개초안의 금액 공시가 최종안에서 질적 기술로 바뀐 점(BC121I~J)과 BC121H(목표 공시는 면제하지 않음)도 원문과 맞다. 개정 후 KSSB 29A~29C와 내용이 같으므로 diff "same"이 맞다.
- **C1A~C6**: C1A의 개정·추가 문단 목록, C1B(2027-01-01 이후 시작 보고기간, 조기 적용 가능, 조기 적용 시 사실 공시), C4(b) 참조를 B58–B63A로 고친 것, C6(a)~(c)의 비교정보 조정 내용, BC164A·BC176의 설명이 모두 원문과 일치한다.
- **'고려해야 한다' 대 '참고할 수 있다'**: IFRS S2 12·23·32·37은 "shall refer to and consider the applicability"이고 B65(d)·B67은 "consider"다. KSSB 12·23·32·37·B65⑷·B67은 '참고할 수 있다'다. 32는 산업기반 지표 공시가 의무("shall disclose")이고 KSSB 28⑵·32는 선택이다. 29(f)(ii) 톤당 가격은 의무이고 KSSB 29⑹㈏는 선택이다. diff "differs" 표지가 모두 맞다.
- **같은 문단(same)**: 1·3·5~7·10(a)~(c)·11·13·14·16~21·22·B4·B18·24~26·29(a)(i)·(vi)·29(b)~(e)·29(g)·33~36·C5를 KSSB 문장과 하나씩 맞대 보았고 실질 차이를 찾지 못했다. KSSB 21⑶의 '지속가능성 관련' 표현 차이도 교재가 이미 짚었다.
- **TPT 매핑**: 5·6(a)→5.1·5.3·5.4·5.5, 6(b)→5.2, 13·14(a)(i)~(ii)→1.2·2.1·2.2·2.3, 14(a)(iii)→3.1~3.3, 9(c)·14(a)(iv)~(v)→1.1.a·1.1.b·1.1.c.i·1.3, 14(b)→2.4.a, 16(c)→2.4.b, 그리고 "IFRS S2는 전환계획 보유를 요구하지 않는다"는 서문 문장이 모두 tpt.txt와 맞다.
- **예시**: BMW 99쪽(세 가지 시나리오, 2036년 중기·2050년 장기), 131쪽(잠재 가격, 재무보고 목적에는 쓰지 않음)이 맞고, ESRS 기준 보고서라는 단서도 붙어 있다.
- **최종 검사(python3 -I)**: JSON 파싱 정상, 회차 id 12개 일치, 블록 no가 s2.txt 또는 amend.txt 문단 머리에 있음(예외: s2-0의 주제 표지 'ISSB', 'IFRS S1'), quote 32개 모두 원문에 있음(모두 2문장 이하), model⊇must 통과, check.ans 범위 통과.

## 3. 확인 필요 (고치지 않음)

1. **s2-0 · C1A의 diff "same"과 kssb "BC125~BC129"**: 개정 '내용'은 KSSB와 같다. 그러나 C1A·C1B 문단 자체(개정 목록, 2027년 시행일, 조기 적용 공시)에는 KSSB 대응 문단이 없다. KSSB는 처음부터 개정을 담았고 자체 C1을 따른다. "s2only"(kssb "없음")나 "differs"가 더 정확할 수 있다.
2. **s2-0 · IFRS S1의 kssb "BC2"**: 블록이 다루는 머리말 문장("IFRS S1의 맥락에서 읽는다")에 대응하는 KSSB 문장은 제2호 머리말(4쪽)이다. BC2는 제정 원칙을 설명하는 결론도출근거다. kssb를 "제2호 머리말"로 바꿀지 판단이 필요하다. 또 IFRS C1의 "S1과 동시 적용" 요구는 KSSB C1에 없다.
3. **s2-1 · 4 (kssb "3A", kssbonly)와 s2-3 · 10(d) (kssb "10B", kssbonly)**: IFRS 문단 4·10(d) 자체는 KSSB 4·10⑷와 같다. 표지는 블록이 강조하는 KSSB 고유 문단을 가리킨다. 화면에서 "IFRS 문단 4는 KSSB에만 있다"로 읽힐 수 있으니 표지가 무엇을 뜻하는지 정할 필요가 있다.
4. **quote가 블록 문단이 아닌 이웃 문단에서 온 경우**: s2-6 · B4(인용은 B17, 29쪽), s2-8 · 29(a)(i)(B30, 32쪽), s2-8 · 29(a)(vi)(B57, 37쪽), s2-9 · 29(b)(29(c)), s2-10 · 36(c)(B69, 42쪽), s2-0 · IFRS S1(C1, 44쪽). 문장 자체는 원문 그대로이고 해설에도 해당 문단이 나온다. 다만 pdfPage는 블록 문단 쪽을 가리킨다.
5. **s2-11 · C5의 차이표**: "참조하고 적용가능성 고려(12, 23, 37, B65, B67)" 행에서 B65(d)·B67의 원문은 "consider"뿐이다. 결론은 같아서 그대로 두었다.
6. **2025년 개정 문단 번호**: S2_BRIEF는 "개정 문단 번호는 원문이 없으므로 쓰지 말라"고 했다. 지금은 ISSB 공식 개정 PDF(amend.txt)가 있어서 교재가 쓴 번호(29A~29C, B21~B22, B24, B28, B62A, B63A, C1A, C1B, C6, BC80A, BC97B, BC97D, BC121H~J, BC164A, BC176)를 모두 이 원문으로 확인했다. 브리프와 어긋나지만 근거가 있으므로 그대로 두었다.

## 4. 전체 평가

신입이 믿고 읽어도 되는 수준이다. 의무와 선택, 조건부 요구(29(a)(ii)·B24, 29A~29C, B17, B18, 20, C4·C6)를 모두 원문대로 썼다. kssb·diff 표지도 46개 중 실질 오류는 없고, 의미를 정해야 할 표지 4건만 남았다(확인 필요 1~3). 고친 것은 잘못된 quote 1건, pdfPage 1건, 원문과 다른 서술 1건, 헷갈리는 오답 문항 1건, 쉬운 말 풀이 2건이다.

가장 약한 회차 3개:
1. **s2-0 (들어가며)**: pdfPage가 틀려 있었다. 블록 no가 문단 번호가 아닌 주제 표지이고, kssb·diff 표지 두 개(C1A, IFRS S1)는 판단이 필요하다.
2. **s2-11 (시행일·경과규정·차이 총정리)**: C6 블록의 quote가 다른 문단(C1B)의 문장이었다. 차이표 한 행의 표현도 원문보다 강하다.
3. **s2-5 (재무적 영향)**: "두 문단 모두 '판단한 경우'"처럼 원문에 없는 말을 붙인 서술이 있었다. 블록이 짧아 KSSB 교재를 먼저 읽지 않은 독자에게는 설명이 얇다.
