# v7 시안 생성기: 목차는 data/books/*.json에서, 기록은 아래 예시 데이터에서 가져와 proto/v7.html을 만든다.
# 실행: python3 proto/src/build-v7.py (저장소 루트에서)
import json, pathlib
R = pathlib.Path(__file__).resolve().parents[2]
book = lambda b: json.loads((R / f"data/books/{b}.json").read_text())["sessions"]

def secs(b, vol, part_of):
    return [{"id": s["id"], "title": s["title"], "vol": vol(s), "part": part_of(s),
             "pp": sorted(set(s["pages"]))} for s in book(b)]

kssb = secs("kssb-1", lambda s: "제1호", lambda s: "들어가며" if s["id"] == "k0" else "제1호 · 일반 요구사항") \
     + secs("kssb-2", lambda s: "제2호", lambda s: "제2호 · 기후 관련 공시")
ets = secs("mrv", lambda s: "보고·인증 지침", lambda s: "배출량 보고·인증 지침 (제2025-64호)") \
    + secs("ver", lambda s: "검증지침", lambda s: "배출권거래제 검증지침 (제2025-165호)")
KASB = "https://www.kasb.or.kr/front/board/View3012.do?siteCd=002000000000000&gubun=3012&accstdSeq={}&seq=&tab=A&bu=B&searchfield=TITLE&searchword=&categoryList=&searchfield2=ENACTMENT_DT&s_date_start=&s_date_end="

docs = [
 {"id": "kssb", "short": "KSSB 제1·2호", "kind": "공시기준", "name": "KSSB 지속가능성 공시기준 제1·2호",
  "edition": "2026.2 의결본", "issuer": "지속가능성기준위원회(KSSB)",
  "about": "한국의 지속가능성 공시기준. 제1호는 공시의 일반 원칙을, 제2호는 기후 관련 공시를 정한다. 목차를 23개 항목으로 나눠 순서대로 읽는다.",
  "links": [{"label": "제1호 원문", "url": KASB.format(3748)}, {"label": "제2호 원문", "url": KASB.format(3749)}], "secs": kssb},
 {"id": "ets", "short": "배출권거래제 지침", "kind": "고시", "name": "배출량 보고·인증 지침 · 배출권거래제 검증지침",
  "edition": "제2025-64호 · 제2025-165호", "issuer": "기후에너지환경부 고시",
  "about": "배출권거래제 대상 업체가 배출량을 어떻게 재고, 명세서를 내고, 검증받는지 정한 고시 두 개.",
  "links": [{"label": "국가법령정보센터", "url": "https://www.law.go.kr/"}], "secs": ets},
 {"id": "ghgp", "short": "GHG 프로토콜", "kind": "국제 표준", "name": "GHG 프로토콜 기업 회계 및 보고 표준",
  "edition": "2004 개정판", "issuer": "WRI · WBCSD", "why": "KSSB 제2호가 배출량 측정 기준으로 지정한 문서", "secs": []},
 {"id": "inv", "short": "국가 인벤토리", "kind": "국가 보고서", "name": "국가 온실가스 인벤토리 보고서",
  "edition": "2024 (2025.1 공표)", "issuer": "온실가스종합정보센터", "why": "국가 단위 배출량과 배출계수의 출처", "secs": []},
]

# ── 예시 읽기 로그 (시안용) ──
log = [("kssb","k0","2026-10-05",34),("kssb","k1-1","2026-10-06",22),("kssb","k1-2","2026-10-08",27),
       ("kssb","k1-3","2026-10-09",48),("kssb","k1-4","2026-10-12",31),("kssb","k2-1","2026-10-15",18),
       ("kssb","k2-8","2026-10-19",41),("kssb","k2-8","2026-10-20",36),
       ("ets","m-1","2026-10-22",29),("ets","m-2","2026-10-23",38),("ets","m-3","2026-10-24",21)]
log = [dict(zip(["doc","sec","date","min"], x)) for x in log]

# ── 예시 기록: 원문에서 확인한 사실로만 ──
recs = [
 {"doc":"kssb","sec":"k0","kind":"요약","date":"2026-10-05","at":"제1호 59쪽 · 금융위원회 로드맵 최종안",
  "text":"공시 의무는 2028년(2027 회계연도)부터 자산 10조 원 이상 코스피 상장사에 시작된다. 기준서의 시행일과 의무공시 시기는 같은 말이 아니다. 시기는 금융위원회가 따로 정한다."},
 {"doc":"kssb","sec":"k0","kind":"질문","date":"2026-10-05","at":"제1호 59쪽",
  "text":"공시한 내용은 어느 수준의 인증을 받아야 하나?",
  "ans":"기준서에는 없다. 인증 수준과 시기는 자본시장법령을 고칠 때 정한다고 되어 있어, 지금은 미해결로 둔다."},
 {"doc":"kssb","sec":"k1-3","kind":"요약","date":"2026-10-09","at":"제1호 9·38쪽 (문단 18, B19)",
  "text":"정보가 중요한지는 기업이 판단한다. 정해진 비율(예: 5%) 같은 기준선은 없고, 크기와 성격을 함께 본다."},
 {"doc":"kssb","sec":"k1-3","kind":"질문","date":"2026-10-09","at":"제1호 42쪽 (B33)",
  "text":"중요한 정보인데 법이 공개를 막으면?",
  "ans":"공개하지 않아도 된다. 다만 그런 이유로 뺀 정보가 있다는 점을 설명해야 한다(B33)."},
 {"doc":"kssb","sec":"k2-8","kind":"요약","date":"2026-10-19","at":"제2호 18~19쪽 (문단 29⑴㈎·㈏·㈒·㈓)",
  "text":"배출량은 Scope 1·2·3을 tCO2e로 나눠 공시하고, GHG 프로토콜(2004)로 잰다. 측정 방법이 섞였을 때만 방법별로 나눈다. Scope 2는 지역기반이 필수, 시장기반은 선택이다."},
 {"doc":"kssb","sec":"k2-8","kind":"질문","date":"2026-10-20","at":"제2호 127쪽 (BC105)",
  "text":"방법이 섞였으면 모든 방법으로 다시 재야 하나?",
  "ans":"아니다. 이미 쓴 방법별로 나눠 보여 주면 된다. 다시 측정하라는 뜻이 아니라고 결론도출근거에 적혀 있다."},
 {"doc":"ets","sec":"m-2","kind":"요약","date":"2026-10-23","at":"보고·인증 지침 8쪽 (제9조)",
  "text":"명세서에서 산정하는 온실가스는 여섯 가지다. 사업장 단위로 배출시설과 배출활동을 빠짐없이 잡는 것이 산정 범위의 출발점이다."},
]

finds = [
 {"id":"f1","title":"온실가스는 여섯 가지인가, 일곱 가지인가","tags":["가스 범위"],"docs":["kssb","ets"],"secs":["k2-8","m-2"],
  "body":"배출권거래제 명세서는 여섯 가지 가스로 산정하는데, KSSB 제2호는 NF3까지 일곱 가지를 합친다. 명세서 숫자를 그대로 공시에 옮기면 범위가 하나 모자랄 수 있다.",
  "a":{"doc":"보고·인증 지침","at":"제9조 · 8쪽","says":"CO2, CH4, N2O, HFCs, PFCs, SF6 — 여섯 가지"},
  "b":{"doc":"KSSB 제2호","at":"B20·B21","says":"여섯 가지에 NF3를 더한 일곱 가지"},
  "check":"보고서에 '6대 온실가스'라고 쓰여 있으면 NF3 배출이 있는지, 공시에서 어떻게 다뤘는지 본다."},
 {"id":"f2","title":"기아 데이터표의 Scope 2는 시장기반 숫자다","tags":["Scope 2","기업 보고서"],"docs":["kssb"],"secs":["k2-8"],
  "body":"기아 보고서 데이터표의 Scope 2 697.9천tCO2e는 검증의견서의 시장기반 합계(697,875)와 같다. 같은 의견서의 지역기반 합계는 861,732다. KSSB 제2호는 지역기반 공시가 필수다.",
  "a":{"doc":"KSSB 제2호","at":"문단 29⑴㈓ · 19쪽","says":"Scope 2는 지역기반으로 공시, 시장기반은 선택"},
  "b":{"doc":"기아 지속가능경영보고서","at":"130·156쪽","says":"데이터표 697.9천 = 시장기반 697,875 (지역기반 861,732)"},
  "check":"데이터표 숫자가 어느 계산법인지 먼저 확인하고, 지역기반 수치가 분명히 공시됐는지 본다."},
 {"id":"f3","title":"공시는 인증 수준이 미정, 명세서는 이미 합리적 보증","tags":["인증·검증"],"docs":["kssb","ets"],"secs":["k0","v-8"],
  "body":"KSSB 공시의 인증 수준과 시기는 아직 정해지지 않았다. 반면 배출권거래제 명세서는 이미 합리적 보증 수준으로 검증받는다. 같은 회사의 Scope 1·2라도 두 숫자가 거친 확인의 깊이가 다를 수 있다.",
  "a":{"doc":"KSSB 제1호","at":"59쪽 · 들어가며","says":"인증 수준·시기는 자본시장법령 개정 때 정함"},
  "b":{"doc":"배출권거래제 검증지침","at":"제2조 제15호","says":"검증은 합리적 보증 수준"},
  "check":"공시의 Scope 1·2가 명세서 검증 결과를 썼는지, 그 밖의 범위는 무엇으로 확인했는지 본다."},
]

# 참조 검사: 없는 목차 id를 쓰면 멈춘다
ids = {d["id"]: {s["id"] for s in d["secs"]} for d in docs}
for x in log + recs: assert x["sec"] in ids[x["doc"]], x
for f in finds:
    for s in f["secs"]: assert any(s in v for v in ids.values()), (f["id"], s)

data = json.dumps({"docs": docs, "log": log, "recs": recs, "finds": finds}, ensure_ascii=False)
tpl = (R / "proto/src/v7-template.html").read_text()
(R / "proto/v7.html").write_text(tpl.replace("__DATA__", data))
print("proto/v7.html", len(data), "bytes of data")
