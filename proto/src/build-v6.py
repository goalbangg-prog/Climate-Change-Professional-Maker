# v6 시안 생성: proto/src/v6-template.html + 데이터 → proto/v6.html
import json,re,html,os,importlib.util as iu
R=os.path.join(os.path.dirname(__file__),'..','..')
J=lambda f:json.load(open(os.path.join(R,f),encoding='utf-8'))
e=html.escape
page=open(os.path.join(R,'src/reading.html'),encoding='utf-8').read()
areas=[dict(id=a,name=n,note=t) for a,n,c,t in re.findall(r'\{id:"([a-z]+)",name:"([^"]+)",c:"([^"]+)",note:"([^"]+)"\}',page)]
FILES={"kssb":["kssb-1","kssb-2"],"s2":["ifrs-s2"],"s1":["ifrs-s1"],"b1":["base-1"],"b2":["base-2"],"b3":["base-3"],"mrv":["mrv"],"ver":["ver"],"ghgp-corp":["ghgp-corp"],"ghgp-s2":["ghgp-s2"],"ghgp-s3":["ghgp-s3"],"tms":["tms"],"envinfo":["envinfo"]}
RAW={b:[s for f in fs for s in J(f'data/books/{f}.json')['sessions']] for b,fs in FILES.items()}
core=J('data/core.json')
books=[dict(id=i,a=a,t=t,s=s,n=int(n),av=i in RAW) for i,a,t,s,n in re.findall(r'\{id:"([^"]+)",a:"([^"]+)",t:"([^"]+)",s:"([^"]+)",n:(\d+)',page)]
def part(b,sid):
    if b=="kssb": return "들어가며" if sid=="k0" else "제1호 일반 요구사항" if sid.startswith("k1") else "제2호 기후 관련 공시"
    if b in("s2","s1"): return "들어가며" if sid.endswith("-0") else "정리" if sid in("s2-11","s1-10") else "본문"
    return next(x['t'] for x in books if x['id']==b)
sess={}
for b,ss in RAW.items():
    z=ss[0]['id'] in("k0",) or ss[0]['id'].endswith("-0")
    sess[b]=[dict(id=s['id'],title=s['title'],min=s['min'],i=(k if z else k+1),part=part(b,s['id']),core=core.get(b,{}).get(s['id'],"")) for k,s in enumerate(ss)]
def text(s): return ' '.join([s['title'],s.get('intro','')]+[' '.join(bl['prose'])+' '+bl.get('label','') for bl in s['blocks']])
KW={"dis":[("중요성",["중요성","중요한 정보"]),("핵심요소 4가지",["핵심요소","핵심 요소"]),("기간범위",["기간범위"]),("재무적 영향",["재무적 영향"]),("기후 회복력",["기후 회복력"]),("시나리오 분석",["시나리오 분석"]),("Scope 3",["스코프 3","Scope 3"]),("방법별 세분화",["방법별"]),("지역기반·시장기반",["지역기반","시장기반"]),("전환계획",["전환계획"]),("내부 탄소 가격",["내부 탄소 가격","내부탄소가격"]),("경과 완화",["경과규정","완화"])],
    "ghg":[("조직경계",["조직경계","조직 경계"]),("운영통제",["운영통제"]),("산정등급(Tier)",["Tier","산정등급"]),("배출계수",["배출계수"]),("활동자료",["활동자료"]),("불확도",["불확도"]),("기준연도 재산정",["재산정"]),("시장기반",["시장기반"]),("15개 카테고리",["카테고리"]),("중요성 기준",["중요성"]),("합리적 보증",["합리적 보증"]),("시정조치",["시정조치"])]}
kw={}
for a,lst in KW.items():
    bs=[b['id'] for b in books if b['a']==a and b['id'] in RAW]
    out=[]
    for k,pats in lst:
        sc=[]
        for b in bs:
            for s in RAW[b]:
                t=text(s);n=sum(t.count(p) for p in pats)
                if n: sc.append((n,s['id']))
        sc.sort(key=lambda x:-x[0])
        if sc: out.append(dict(k=k,hits=[i for _,i in sc[:8]]))
    kw[a]=out
# 19회차 본문: 절충안 2 원고
sp=iu.spec_from_file_location('d',os.path.join(os.path.dirname(__file__),'k2-8-c.data.py'));m=iu.module_from_spec(sp);sp.loader.exec_module(m);B=m.B
S=[x for x in RAW['kssb'] if x['id']=='k2-8'][0]
terms={t['t']:t for bl in S['blocks'] for t in bl.get('terms',[])}
used=set()
def tx(s):
    h=e(s).replace('[[','<mark>').replace(']]','</mark>')
    for k,t in terms.items():
        if k in used: continue
        mm=re.search(re.escape(e(k))+r'(?![^<]*>)',h)
        if mm: used.add(k);h=h[:mm.start()]+f'<button type="button" class="term" data-d="{e(t["d"])}" data-en="{e(t.get("en",""))}">{e(k)}</button>'+h[mm.end():]
    return h
rf=lambda r:f' <span class="rf">{e(r)}</span>' if r else ''
blocks=[]
for b in B:
    segs=''
    for lab,items in b['segs']:
        body=''
        for it in items:
            k=it[0]
            if k=='p': body+=f'<p>{tx(it[1])}{rf(it[2])}</p>'
            elif k=='li': body+='<ul>'+''.join(f'<li>{tx(a)}{rf(r)}</li>' for a,r in it[1])+'</ul>'
            elif k=='table': body+=f'<span class="cap">{e(it[1])}</span><div class="tw"><table class="tbl"><thead><tr>{"".join(f"<th>{e(x)}</th>" for x in it[2])}</tr></thead><tbody>{"".join("<tr>"+"".join(f"<td>{e(c)}</td>" for c in r)+"</tr>" for r in it[3])}</tbody></table></div>'
            elif k=='ex': body+=f'<p>{tx(it[1])}</p>'+(f'<small class="exs">{e(it[2])}</small>' if it[2] else '')
            elif k=='quote': body+=f'<blockquote class="oq"><span class="k">원문 한 줄 · {e(it[2])}</span>{e(it[1])}</blockquote>'
        segs+=f'<div class="sg{" ex" if lab=="실무에서는" else ""}"><div class="sl">{e(lab)}</div><div class="sb">{body}</div></div>'
    blocks.append(dict(title=b['title'],ref=b['ref'],own=b.get('own',''),html=segs))
read={"k2-8":dict(title="온실가스 배출량",sub="Scope 1·2·3 총량 · 측정 기준 · 방법이 섞이면 나눠서 · Scope 2는 지역기반",pages="18~21쪽",
  key="KSSB 제2호는 온실가스 배출량을 <mark>Scope 1·2·3으로 나눠 tCO2e로</mark> 공시하게 한다. 기준은 GHG 프로토콜이고, <mark>재는 방법이 섞였을 때만 방법별로 나누며</mark>, Scope 2는 <mark>지역기반이 필수</mark>다.",
  three=[e(x) for x in ["배출량은 Scope 1·2·3으로 나눠 tCO2e로, GHG 프로토콜을 기준으로 잰다.","재는 방법이 섞였을 때만 방법별로 나눈다. Scope 2는 지역기반이 필수, 시장기반은 선택이다.","Scope 3는 포함한 카테고리를 밝히고, 투자(카테고리 15)는 금융배출량으로 좁힐 수 있다."]],blocks=blocks)}
quiz={"k2-8":dict(w=S['write'],c=S['check'])}
seed=[dict(sid="k2-8",kind="형광펜",text="Scope 2는 지역기반으로 공시한다. 시장기반은 공시해도 되고, 안 해도 된다.",memo="기아 데이터표는 시장기반 → 지역기반 확인",tags=["면접","보고서검토"]),
      dict(sid="k2-8",kind="메모",text="방법별 세분화는 섞였을 때만. 다시 잴 필요 없음(BC105).",memo="",tags=["헷갈림"]),
      dict(sid="k2-8",kind="한 줄 쓰기",text="국내는 배출권거래제 지침, 해외는 GHG 프로토콜처럼 재는 방법이 섞여 있을 때만 Scope 1·2를 방법별로 나눠 공시한다.",memo="",tags=[])]
D=dict(areas=areas,books=books,sess=sess,kw=kw,read=read,quiz=quiz,seedNotes=seed)
tpl=open(os.path.join(os.path.dirname(__file__),'v6-template.html'),encoding='utf-8').read()
out=tpl.replace('__DATA__',json.dumps(D,ensure_ascii=False).replace('</','<\\/'))
open(os.path.join(R,'proto/v6.html'),'w',encoding='utf-8').write(out)
print('ok',len(out),{a:[k['k']+':'+str(len(k['hits'])) for k in v] for a,v in kw.items()})
