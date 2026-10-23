const fs=require("fs"),path=require("path");
const R=p=>path.join(__dirname,"..",p);
const load=f=>{try{return JSON.parse(fs.readFileSync(f,"utf8"))}catch(e){console.error("missing",f);return null}};

/* ---- v1 content ---- */
const src=fs.readFileSync(R("data/v1/ifrs-s2-data.js"),"utf8");
const {J,C}=new Function(src+";return {J,C};")();
const lvJ={j1:1,j2:3,j3:2,j4:3,j5:1,j6:3,j7:2,j8:2,j9:3,j10:1,j11:2,j12:1,j13:1,j14:2,j15:3,j16:2,j17:2};
const lvC={c1:1,c2:1,c3:1,c4:2,c5:3,c6:3,c7:1,c8:2,c9:2,c10:1};
const ifrs=[
  ...J.map(x=>({id:"ifrs-"+x.id,module:"ifrs",type:"judge",level:lvJ[x.id]||2,tags:[x.topic],ref:x.para.replace("IFRS S2 ",""),topic:x.topic,q:x.q,look:x.look,page:x.page,ans:x.ans,quote:x.quote,why:x.why,trap:x.trap+(x.kssb?" "+x.kssb:""),sources:[{label:`현대자동차 2026 지속가능성 보고서 p.${x.page}`,url:"report"}]})),
  ...C.map(x=>({id:"ifrs-"+x.id,module:"ifrs",type:"calc",level:lvC[x.id]||2,tags:[x.topic],ref:"계산 · "+x.topic,topic:x.topic,q:x.q,given:x.given,ans:x.ans,tol:x.tol,unit:x.unit,dec:x.dec,abs:x.abs,steps:x.steps,insight:x.insight,
    sources:[...new Set(x.given.map(g=>g[2]).filter(p=>/\d/.test(p)))].map(p=>({label:`현대자동차 2026 지속가능성 보고서 p.${p.match(/\d+/)[0]}`,url:"report"}))}))
];
ifrs.filter(x=>["ifrs-j3","ifrs-j4"].includes(x.id)).forEach(x=>x.sources.push({label:"ISSB, IFRS S2 개정 발표 (2025.12)",url:"https://www.ifrs.org/news-and-events/news/2025/12/issb-issues-targeted-amendments-ifrs-s2/"}));
const SHORTREF={"kssb-01":"금융위 최종안(2026.7.8) · 공시 대상","kssb-02":"금융위 최종안 · Scope 3 유예","kssb-03":"금융위 최종안 · 공시 방식","kssb-04":"금융위 최종안 · 인증","kssb-05":"금융위 최종안 · 제재 면책","kssb-06":"KSSB 제1·2호 (2026.2.26 확정)","kssb-08":"KSSB 제2호 · 측정 방법",
"esrs-01":"ESRS 1 문단 37·43·49 (2023)","esrs-02":"ESRS E1-6 vs IFRS S2 29(a)","esrs-03":"ESRS E1-7 문단 56 (2023)","esrs-04":"개정 ESRS E1 (2026.7.3)","esrs-05":"개정 ESRS · 적용 시기","esrs-06":"Omnibus I · CSRD 적용 범위","esrs-07":"ISSB–EFRAG 상호운용성 지침","esrs-08":"ESRS 1 문단 37 · ESRS 2 IRO-1","esrs-09":"ESRS 1 문단 28","esrs-10":"ESRS E1-6 문단 49 (2023)","esrs-11":"ESRS E1-8 문단 62–63 (2023)","esrs-12":"ESRS E1-6 문단 44(d)·53 (2023)",
"gs-01":"GRI 1 · 요구사항 1~9","gs-02":"GRI 3 · 3-1~3-3","gs-04":"GRI 305-1c·305-3c·102-5c","gs-05":"GRI 102·103 (2025)","gs-06":"GRI 1 · IFRS S2 · SASB",
"rt-01":"CDP 채점 방법론","rt-02":"CDP 필수 기준 2024 · A리스트","rt-03":"CDP 통합 질문서(2024~)","rt-04":"CDP 질문 7.6·7.7·7.8","rt-05":"EcoVadis 평가 방법론","rt-06":"EcoVadis 메달 기준","rt-07":"EcoVadis · 협력사 평가","rt-08":"S&P CSA 방법론 2026","rt-09":"S&P MSA 가이드북","rt-10":"S&P CSA · DJ Best in Class","rt-11":"KCGS ESG 평가 등급","rt-12":"KCGS 영역별·통합 등급","rt-13":"평가기관 지표 활용"};
const v1=[];
for(const f of ["kssb","esrs","gri-sasb","ratings"]){const d=load(R("data/v1/"+f+".json"))||[];d.forEach(x=>{if(SHORTREF[x.id]){x.refFull=x.ref;x.ref=SHORTREF[x.id]}
  if(!x.level)x.level=x.type==="judge"?2:/옳지 않은|경계|개정|옴니버스|경감/.test(x.q)?3:/무엇인가\?$|맞는 것은|옳은 것은/.test(x.q)?1:2;
  if(!x.tags)x.tags=[x.topic];v1.push(x)})}

/* ---- modules ---- */
// asof = 문항이 전제하는 기준 시점 (화면에 그대로 표시)
const MODS=[
 {id:"landscape",g:"map",name:"공시 체계 지도",short:"체계 지도",who:"참고 자료 · 읽기만",desc:"TCFD에서 ISSB·ESRS·KSSB까지 어떤 기준이 어떻게 이어지는지 한 장으로 정리한 참고 글. 문항은 없다.",asof:"2026년 10월 기준 · 국가별 도입 현황은 변동이 잦다"},
 {id:"ifrs-s1",g:"std",name:"IFRS S1 일반 요구사항",short:"IFRS S1",who:"투자자 · 공통 규칙",desc:"중대성, 보고 실체, 비교 정보, 추정과 오류 같은 모든 지속가능성 공시의 공통 규칙.",asof:"IFRS S1 (2023 발행) · 2024.1 적용"},
 {id:"ifrs",g:"std",name:"IFRS S2 지표·목표",short:"S2 지표",who:"투자자 · 재무 중대성",desc:"현대차 보고서의 지표·목표 공시를 문단 단위로 판정하고 숫자를 직접 계산한다.",asof:"IFRS S2 (2023) + 2025.12 GHG 개정 (2027.1 적용) · 현대차 FY2025 보고서"},
 {id:"ifrs-s2x",g:"std",name:"IFRS S2 거버넌스·전략·위험",short:"S2 전략",who:"투자자 · 재무 중대성",desc:"거버넌스, 전략, 재무영향, 시나리오, 위험관리와 산업별 지표, Scope 3 측정 체계.",asof:"IFRS S2 (2023) + 2025.12 개정"},
 {id:"kssb",g:"std",name:"KSSB 제2호",short:"KSSB",who:"국내 투자자 · 의무공시",desc:"IFRS S2를 바탕으로 한 한국 기준. 누가 언제부터 공시하는지, 무엇이 유예되는지.",asof:"KSSB 제1·2호 (2026.2.26 확정) · 금융위 최종안 (2026.7.8, 법제화 진행 중)"},
 {id:"esrs",g:"std",name:"ESRS E1 기초",short:"ESRS",who:"EU · 이중 중대성",desc:"EU 기후 기준의 뼈대. 이중 중대성, E1-6, 2026년 개정과 옴니버스.",asof:"ESRS 2023 Set 1 · 개정 ESRS (2026.7.3 채택) · Omnibus I (2026/470)"},
 {id:"esrsx",g:"std",name:"ESRS·CSRD 심화",short:"ESRS 심화",who:"EU · 실무",desc:"ESRS 1·2 공통 요구사항, E1 공시요구사항 전체, 택소노미 연계, VSME.",asof:"ESRS 2023 Set 1 · 개정 ESRS (2026.7.3 채택)"},
 {id:"gri-sasb",g:"std",name:"GRI · SASB 기초",short:"GRI·SASB",who:"보고서 작성 실무",desc:"GRI 305 배출 공시와 SASB 자동차 산업 지표를 현대차 색인과 대조한다.",asof:"GRI 2021 (GRI 1·2·3) · GRI 305 (2016) · GRI 102·103 (2025, 2027.1 시행) · SASB TR-AU (2023)"},
 {id:"grix",g:"std",name:"GRI 심화",short:"GRI 심화",who:"보고서 작성 실무",desc:"GRI 1·2·3 원칙과 요구사항, 섹터 기준, 새 기후 기준 GRI 102·103.",asof:"GRI 2021 · GRI 102·103 (2025)"},
 {id:"ghgp",g:"meas",name:"GHG 프로토콜",short:"GHG 프로토콜",who:"측정 · 산정 실무",desc:"조직경계, 기준연도 재산정, Scope 2 지침, Scope 3 15개 카테고리와 산정 방법.",asof:"기업 표준 (2004·2015 개정) · Scope 2 지침 (2015) · Scope 3 표준 (2011) · Scope 2 개정 진행 중"},
 {id:"lca",g:"meas",name:"LCA · 제품 탄소발자국",short:"LCA",who:"측정 · 제품",desc:"ISO 14040/44/67, 기능단위, 할당, EPD와 환경성적표지, 배터리 규정 탄소발자국.",asof:"ISO 14040/44 (2006, 2020 개정) · ISO 14067 (2018) · EU 배터리 규정 (2023/1542)"},
 {id:"assurance",g:"meas",name:"제3자 검증·인증",short:"검증",who:"측정 · 신뢰성",desc:"제한적·합리적 보증, ISAE 3000/3410, ISSA 5000, ISO 14064-3, 중요성 기준.",asof:"ISAE 3000 (개정) · ISAE 3410 · ISSA 5000 (2024 발행, 2026.12 이후 적용) · ISO 14064-3 (2019)"},
 {id:"physical",g:"meas",name:"물리적 위험·기후과학",short:"물리 위험",who:"위험 · 과학 기초",desc:"IPCC AR6, 재해 유형, 위험 평가 방법, 적응과 자산 노출 산정.",asof:"IPCC AR6 (2021–2023) · IFRS S2 29(c)"},
 {id:"scenario",g:"meas",name:"시나리오 분석·재무영향",short:"시나리오",who:"전략 · 재무영향",desc:"IEA·NGFS·IPCC 시나리오, 탄소가격 가정, 재무영향 경로와 흔한 실수.",asof:"IEA WEO 2025 · NGFS Phase V (2024) · IFRS S2 문단 22"},
 {id:"korea",g:"reg",name:"국내 기후 제도",short:"국내 제도",who:"제도 · 배출권거래제",desc:"탄소중립기본법, 배출권거래제 할당·MRV·과징금, 목표관리제, 국가 배출계수.",asof:"탄소중립기본법 (2022 시행) · 배출권거래제 4차 계획기간 (2026–2030) · 2026년 10월 법령 기준"},
 {id:"markets",g:"reg",name:"탄소시장 · CBAM",short:"탄소시장",who:"제도 · 국제",desc:"EU ETS, CBAM 본격 시행, 파리협정 6조, 자발적 탄소시장과 크레딧 품질.",asof:"CBAM 본격 시행 (2026.1) · EU ETS 4기 · ICVCM CCP (2024)"},
 {id:"targets",g:"reg",name:"감축목표 · 전환계획",short:"목표·전환",who:"전략 · SBTi",desc:"SBTi 넷제로 기준, 1.5℃ 경로, 전환계획 요소, 크레딧 사용 규칙.",asof:"SBTi 기업 넷제로 기준 V1.3.1 · V2.0 (2026 확정, 전환기) · IFRS S2 문단 14"},
 {id:"finance",g:"reg",name:"금융배출량 · 택소노미",short:"금융",who:"금융 · 그린워싱",desc:"PCAF, 택소노미(EU·K), 녹색채권, 그린워싱 규제.",asof:"PCAF 표준 2판 (2022) · EU 택소노미 기후 위임규정 · K-택소노미 (2022·2023 개정)"},
 {id:"ratings",g:"prac",name:"ESG 평가 대응",short:"ESG 평가",who:"평가기관 대응",desc:"CDP, EcoVadis, S&P CSA, KCGS가 무엇을 보고 어떻게 점수를 매기는지.",asof:"CDP 2026 질문서 · EcoVadis 방법론 (2025) · S&P CSA 2026 · KCGS 2025 평가 (KCGS는 2차 자료)"},
 {id:"practice",g:"prac",name:"보고서 작성 실무",short:"작성 실무",who:"컨설턴트 워크플로",desc:"보고 범위·기준·재작성, 데이터 수집과 오류, 색인표, 검증 준비, 연간 일정.",asof:"GRI 2021 · AA1000AS v3 · 현대차 FY2025 보고서"},
 {id:"kia",g:"co",name:"기아 보고서 판정",short:"기아",who:"기업 사례 · 비교",desc:"현대차에 던진 질문을 기아 2026 지속가능경영보고서(FY2025)에 그대로 던진다. 같은 질문, 다른 답.",asof:"기아 Sustainability Report 2026 (국문, FY2025) · IFRS S2·KSSB·GRI 기준"}
];
const GROUPS={map:{name:"지도",color:"ratings"},std:{name:"공시 기준",color:"ifrs"},meas:{name:"측정·검증",color:"esrs"},reg:{name:"제도·시장",color:"kssb"},prac:{name:"실무·평가",color:"gri-sasb"},co:{name:"기업 사례",color:"ratings"}};
MODS.forEach(m=>m.color=GROUPS[m.g].color);
const LESSONS={};const v2=[];
for(const m of MODS){
  if(["ifrs","kssb","esrs","gri-sasb","ratings","kia"].includes(m.id))continue;
  const d=load(R("data/modules/"+m.id+".json"));if(!d){m.missing=true;continue}
  LESSONS[m.id]=d.lesson;
  (d.items||[]).forEach(x=>{x.module=m.id;if(!x.level)x.level=2;if(!x.tags)x.tags=[x.topic];v2.push(x)});
}
const L1=load(R("data/modules/lessons-v1.json"))||{};for(const k in L1)LESSONS[k]=L1[k];

/* ---- company packs ---- */
const COMPANIES={hyundai:{id:"hyundai",name:"현대자동차",short:"현대차",report:"2026 지속가능성 보고서 (FY2025, 국문)",pdf:"https://www.hyundai.com/content/dam/hyundai/kr/ko/data/company-report/2026/07/15/hmc-sr-kor-2026.pdf",pages:0}};
const KEYS=load(R("data/companies/keys.json"))||{};   // key → hyundai item id
const co=[];
const kia=load(R("data/companies/kia.json"));
if(kia){
  COMPANIES.kia={id:"kia",name:kia.name||"기아",short:"기아",report:kia.report,pdf:"reports/kia-sr-2026-kor.pdf",pages:kia.pages,framework:kia.framework,profile:kia.profile,notes:kia.notes};
  (kia.judge||[]).forEach(x=>{co.push(Object.assign({},x,{module:"kia",type:"judge",co:"kia",level:x.level||2,tags:x.tags||[x.topic],sources:[{label:`기아 Sustainability Report 2026 p.${x.page}`,url:"report:kia"}]}))});
  (kia.calc||[]).forEach(x=>{co.push(Object.assign({},x,{module:"kia",type:"calc",co:"kia",level:x.level||2,tags:x.tags||[x.topic],ref:x.ref||("계산 · "+x.topic),sources:[...new Set((x.given||[]).map(g=>g[2]).filter(p=>/\d/.test(String(p))))].map(p=>({label:`기아 Sustainability Report 2026 p.${String(p).match(/\d+/)[0]}`,url:"report:kia"}))}))});
}else MODS.find(m=>m.id==="kia").missing=true;
// hyundai items get keys too
const idToKey={};for(const k in KEYS)if(!idToKey[KEYS[k]])idToKey[KEYS[k]]=k;

const EXCL=(load(R("data/exclude.json"))||{ids:{}}).ids;
const ALL=[...ifrs,...v1,...v2,...co].filter(x=>MODS.some(m=>m.id===x.module));
const ITEMS=ALL.filter(x=>!EXCL[x.id]);
console.error("excluded",ALL.length-ITEMS.length,"items (data/exclude.json)");
MODS.forEach(m=>{if(!m.missing&&!ITEMS.some(x=>x.module===m.id)&&LESSONS[m.id])m.ref=true});
ITEMS.forEach(x=>{if(idToKey[x.id]){x.key=idToKey[x.id];x.co=x.co||"hyundai"}});

/* ---- reliability metadata ---- */
const PRIMARY=/(^|\.)(ifrs\.org|efrag\.org|eur-lex\.europa\.eu|europa\.eu|europarl\.europa\.eu|globalreporting\.org|ghgprotocol\.org|sciencebasedtargets\.org|cdp\.net|ecovadis\.com|spglobal\.com|fsc\.go\.kr|korea\.kr|kma\.go\.kr|weather\.go\.kr|greenproduct\.go\.kr|law\.go\.kr|me\.go\.kr|gir\.go\.kr|ipcc\.ch|iea\.org|ngfs\.net|iso\.org|iaasb\.org|iosco\.org|unfccc\.int|un\.org|undrr\.org|wmo\.int|wri\.org|wbcsd\.org|carbonaccountingfinancials\.com|icvcm\.org|vcmintegrity\.org|verra\.org|fsb-tcfd\.org|tnfd\.global|accountability\.org|environdec\.com|ecoinvent\.org|msci\.com|icmagroup\.org|xbrl\.org|aasb\.gov\.au|gov\.uk|fsa\.go\.jp|epa\.ie|usgs\.gov|iais\.org|unglobalcompact\.org|gfanzero\.com|hyundaimotorgroup\.com|ksa\.or\.kr|energy\.or\.kr|kdi\.re\.kr|icapcarbonaction\.com|kdb\.co\.kr|navercorp\.com|mazda\.com|ilo\.org|iata\.org|ghginstitute\.org|plaintextipcc\.com)$/;
const host=u=>{try{return new URL(u).hostname}catch(e){return ""}};
ITEMS.forEach(x=>{
  const srcs=x.sources||[];const rep=srcs.some(s=>/^report/.test(s.url));const prim=srcs.some(s=>!/^report/.test(s.url)&&PRIMARY.test(host(s.url)));const sec=srcs.some(s=>!/^report/.test(s.url)&&!PRIMARY.test(host(s.url)));
  const unv=/확인 필요|미확인/.test([x.ref,x.refFull,x.why,x.trap,x.quote].join(" "));
  // verify: 어떤 방식으로 확인했나
  if(x.type==="judge"&&rep&&x.quote)x.verify="원문 대조";
  else if(x.type==="calc")x.verify="재검산";
  else if(prim)x.verify="공식 자료";
  else if(rep)x.verify="원문 대조";
  else if(sec)x.verify="2차 자료";
  else x.verify="확인 필요";
  if(unv)x.verify="확인 필요";
  x.src=rep?"보고서 원문":prim?"공식 1차 자료":sec?"2차 자료":"출처 없음";
  if(x.confidence==="medium"&&x.verify!=="확인 필요")x.verify="공식 자료·주의";
});

/* ---- sanity / data checks ---- */
const ids=new Set();const bad=[],warn=[];
const qs=new Map();
ITEMS.forEach(x=>{if(ids.has(x.id))bad.push("dup "+x.id);ids.add(x.id);
  if(!["judge","mc","calc"].includes(x.type))bad.push("type "+x.id);
  if(x.type==="judge"&&(!["있음","일부","없음","해당 없음"].includes(x.ans)||!x.page))bad.push("judge "+x.id);
  if(x.type==="judge"&&!x.quote&&x.ans!=="해당 없음")warn.push("no quote "+x.id);
  if(x.type==="mc"&&!(x.options&&x.options.length>=2&&x.options[x.ans]!==undefined))bad.push("mc "+x.id);
  if(x.type==="mc"&&x.options&&new Set(x.options).size!==x.options.length)bad.push("mc dup options "+x.id);
  if(x.type==="calc"&&(typeof x.ans!=="number"||!x.steps))bad.push("calc "+x.id);
  if(x.type==="calc"&&!(x.tol>=0))bad.push("calc tol "+x.id);
  if(![1,2,3].includes(x.level))x.level=2;
  if(!x.why&&!x.insight)bad.push("no why "+x.id);
  if(!(x.sources&&x.sources.length))warn.push("no sources "+x.id);
  if(String(x.ref||"").length>44)warn.push("long ref "+x.id);
  const qk=String(x.q).replace(/\s+/g," ").trim();if(qs.has(qk)&&!x.co)warn.push("same q "+x.id+" = "+qs.get(qk));qs.set(qk,x.id);
  (x.sources||[]).forEach(s=>{if(!/^report/.test(s.url)&&!/^https?:\/\//.test(s.url))bad.push("bad url "+x.id)});
});
if(bad.length){console.error("ERRORS",bad);process.exit(1)}
if(warn.length)console.error("warnings",warn.length,warn.slice(0,12).join("; "),warn.length>12?"…":"");

const MAP=(load(R("data/v1/mapping.json"))||[]).map((m,i)=>{const key=["scope1","scope2","scope3","targets","transition","scenario","icp","pay"][i];
  const plain=s=>String(s||"").replace(/이에요\./g,"이다.").replace(/예요\./g,"다.").replace(/해요\./g,"한다.").replace(/있어요\./g,"있다.").replace(/돼요\./g,"된다.").replace(/게 해요/g,"게 한다").replace(/쳐요\./g,"친다.").replace(/요\./g,".").replace(/요$/,"");
  const [esrs,...rest]=String(m.esrs).split(/\s*\/\s*(?=간소화 ESRS)/);
  const SHORT={scope3:{ifrs:"29(a)(vi) 카테고리 명시",kssb:"Scope 3 공시 3년 유예",esrs:"E1-6 문단 51 → 개정 E1-8",gri:"305-3 → 102-7 (2027~)",cdp:"질문 7.8"}};
  return Object.assign({},m,{key,kssb:String(m.kssb).replace("IFRS S2와 동일 구조(문단 번호 확인 필요)","IFRS S2와 같은 구조 (확인 필요)"),esrs,esrsNote:rest.join(" / "),plain:plain(m.plain),diff:plain(m.diff),hyundai:{page:+(String(m.hyundai.page).match(/\d+/)||[38])[0],pageLabel:m.hyundai.page,fact:m.hyundai.fact},short:SHORT[key]||null})});

/* ---- job tracks (취업 경로) ---- */
const TRACKS=load(R("data/tracks.json"));
const ASSIGN=(load(R("data/assignments.json"))||[]).map(a=>{const missing=a.rows.filter(id=>!ITEMS.some(x=>x.id===id));if(missing.length){console.error("assignment",a.id,"missing rows",missing);process.exit(1)}return a});

/* ---- courses (클래스별 코스) ---- */
const CJ=load(R("data/courses.json"))||{xp:{},courses:{}};
const TYPEP={judge:0,calc:1,mc:2};
const COURSES={};
for(const tid in CJ.courses){
  const usedCase={hyundai:new Set(),kia:new Set()};
  COURSES[tid]=CJ.courses[tid].map((ch,ci)=>({name:ch.name,goal:ch.goal,nodes:ch.nodes.map((n,ni)=>{
    const node=Object.assign({id:`${tid}-${ci}-${ni}`},n);
    if(n.t==="read"){if(!LESSONS[n.mod]){console.error("course read missing lesson",tid,n.mod);process.exit(1)}node.name=MODS.find(m=>m.id===n.mod).name}
    if(n.t==="drill"){const pool=ITEMS.filter(x=>x.module===n.mod&&(n.lv===0||x.level===n.lv)).sort((a,b)=>TYPEP[a.type]-TYPEP[b.type]||a.id.localeCompare(b.id));
      node.ids=pool.slice(0,n.n).map(x=>x.id);if(node.ids.length<Math.min(n.n,3)){console.error("drill pool thin",tid,n.mod,n.lv,node.ids.length);process.exit(1)}node.name=MODS.find(m=>m.id===n.mod).name}
    if(n.t==="assign"){const a=ASSIGN.find(z=>z.id===n.id);if(!a){console.error("course assign missing",n.id);process.exit(1)}node.name=a.title}
    if(n.t==="case"){const pool=ITEMS.filter(x=>x.type==="judge"&&x.ans!=="해당 없음"&&(n.co==="kia"?x.co==="kia":(x.key&&(x.co||"hyundai")==="hyundai"))&&!usedCase[n.co].has(x.id));
      node.ids=pool.slice(0,n.n).map(x=>x.id);node.ids.forEach(id=>usedCase[n.co].add(id));node.name=(n.co==="kia"?"기아":"현대차")+" 케이스 "+node.ids.length+"개"}
    if(n.t==="compare")node.name="기업 비교 · 처방 "+n.n+"건";
    return node})}));
}
const XP=CJ.xp;
const data=`const COURSES=${JSON.stringify(COURSES)};\nconst XP=${JSON.stringify(XP)};\nconst MODS=${JSON.stringify(MODS)};\nconst GROUPS=${JSON.stringify(GROUPS)};\nconst LESSONS=${JSON.stringify(LESSONS)};\nconst ITEMS=${JSON.stringify(ITEMS)};\nconst MAP=${JSON.stringify(MAP)};\nconst TRACKS=${JSON.stringify(TRACKS)};\nconst COMPANIES=${JSON.stringify(COMPANIES)};\nconst ASSIGN=${JSON.stringify(ASSIGN)};\nconst BUILT=${JSON.stringify(new Date().toISOString().slice(0,10))};`;
const page=fs.readFileSync(path.join(__dirname,"page.html"),"utf8");
const style=fs.readFileSync(path.join(__dirname,"style.css"),"utf8").replace("</style>",fs.readFileSync(path.join(__dirname,"extra.css"),"utf8")+fs.readFileSync(path.join(__dirname,"v3.css"),"utf8")+"</style>");
const out=page.replace("/*STYLE*/",()=>style).replace("/*DATA*/",()=>data.replace(/<\/script/g,"<\\/script"));
fs.writeFileSync(R("index.html"),out);
const by={};ITEMS.forEach(x=>{by[x.module]=by[x.module]||{n:0,l:[0,0,0,0]};by[x.module].n++;by[x.module].l[x.level]++});
const vf={};ITEMS.forEach(x=>vf[x.verify]=(vf[x.verify]||0)+1);
console.log("items",ITEMS.length,"modules",MODS.filter(m=>!m.missing).length,"missing",MODS.filter(m=>m.missing).map(m=>m.id).join(","),"lessons",Object.keys(LESSONS).length,"keys",Object.keys(KEYS).length);
console.log(Object.entries(by).map(([k,v])=>`${k}:${v.n}(${v.l.slice(1).join("/")})`).join(" "));
console.log("verify",JSON.stringify(vf));
fs.writeFileSync(path.join(__dirname,"../data/check.json"),JSON.stringify({built:new Date().toISOString(),items:ITEMS.length,byModule:by,verify:vf,warnings:warn},null,1));
