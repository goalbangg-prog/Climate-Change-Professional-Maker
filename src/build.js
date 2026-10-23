// node build2.js → index.html, test.html  (v2: 20 modules, lessons, levels)
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
"esrs-01":"ESRS 1 ¶37·43·49 (2023)","esrs-02":"ESRS E1-6 vs IFRS S2 29(a)","esrs-03":"ESRS E1-7 ¶56 (2023)","esrs-04":"개정 ESRS E1 (2026.7.3)","esrs-05":"개정 ESRS · 적용 시기","esrs-06":"Omnibus I · CSRD 적용 범위","esrs-07":"ISSB–EFRAG 상호운용성 지침","esrs-08":"ESRS 1 ¶37 · ESRS 2 IRO-1","esrs-09":"ESRS 1 ¶28","esrs-10":"ESRS E1-6 ¶49 (2023)","esrs-11":"ESRS E1-8 ¶62–63 (2023)","esrs-12":"ESRS E1-6 ¶44(d)·53 (2023)",
"gs-01":"GRI 1 · 요구사항 1~9","gs-02":"GRI 3 · 3-1~3-3","gs-04":"GRI 305-1c·305-3c·102-5c","gs-05":"GRI 102·103 (2025)","gs-06":"GRI 1 · IFRS S2 · SASB",
"rt-01":"CDP 채점 방법론","rt-02":"CDP 필수 기준 2024 · A리스트","rt-03":"CDP 통합 질문서(2024~)","rt-04":"CDP 질문 7.6·7.7·7.8","rt-05":"EcoVadis 평가 방법론","rt-06":"EcoVadis 메달 기준","rt-07":"EcoVadis · 협력사 평가","rt-08":"S&P CSA 방법론 2026","rt-09":"S&P MSA 가이드북","rt-10":"S&P CSA · DJ Best in Class","rt-11":"KCGS ESG 평가 등급","rt-12":"KCGS 영역별·통합 등급","rt-13":"평가기관 지표 활용"};
const v1=[];
for(const f of ["kssb","esrs","gri-sasb","ratings"]){const d=load(R("data/v1/"+f+".json"))||[];d.forEach(x=>{if(SHORTREF[x.id]){x.refFull=x.ref;x.ref=SHORTREF[x.id]}
  if(!x.level)x.level=x.type==="judge"?2:/옳지 않은|경계|개정|옴니버스|경감/.test(x.q)?3:/무엇인가\?$|맞는 것은|옳은 것은/.test(x.q)?1:2;
  if(!x.tags)x.tags=[x.topic];v1.push(x)})}

/* ---- v2 content ---- */
const MODS=[
 // 공시 기준
 {id:"landscape",g:"map",name:"공시 체계 지도",short:"체계 지도",who:"입문 · 전체 흐름",desc:"TCFD에서 ISSB·ESRS·KSSB까지, 어떤 기준이 언제 생겨 어떻게 이어지는지 전체 지도를 그린다."},
 {id:"ifrs-s1",g:"std",name:"IFRS S1 일반 요구사항",short:"IFRS S1",who:"투자자 · 공통 규칙",desc:"중대성, 보고 실체, 비교 정보, 추정과 오류 같은 모든 지속가능성 공시의 공통 규칙."},
 {id:"ifrs",g:"std",name:"IFRS S2 지표·목표",short:"S2 지표",who:"투자자 · 재무 중대성",desc:"현대차 보고서의 지표·목표 공시를 문단 단위로 판정하고 숫자를 직접 계산한다."},
 {id:"ifrs-s2x",g:"std",name:"IFRS S2 거버넌스·전략·위험",short:"S2 전략",who:"투자자 · 재무 중대성",desc:"거버넌스, 전략, 재무영향, 시나리오, 위험관리와 산업별 지표, Scope 3 측정 체계."},
 {id:"kssb",g:"std",name:"KSSB 제2호",short:"KSSB",who:"국내 투자자 · 의무공시",desc:"IFRS S2를 바탕으로 한 한국 기준. 누가 언제부터 공시하는지, 무엇이 유예되는지."},
 {id:"esrs",g:"std",name:"ESRS E1 기초",short:"ESRS",who:"EU · 이중 중대성",desc:"EU 기후 기준의 뼈대. 이중 중대성, E1-6, 2026년 개정과 옴니버스."},
 {id:"esrsx",g:"std",name:"ESRS·CSRD 심화",short:"ESRS 심화",who:"EU · 실무",desc:"ESRS 1·2 공통 요구사항, E1 공시요구사항 전체, 택소노미 연계, VSME."},
 {id:"gri-sasb",g:"std",name:"GRI · SASB 기초",short:"GRI·SASB",who:"보고서 작성 실무",desc:"GRI 305 배출 공시와 SASB 자동차 산업 지표를 현대차 색인과 대조한다."},
 {id:"grix",g:"std",name:"GRI 심화",short:"GRI 심화",who:"보고서 작성 실무",desc:"GRI 1·2·3 원칙과 요구사항, 섹터 기준, 새 기후 기준 GRI 102·103."},
 // 측정
 {id:"ghgp",g:"meas",name:"GHG 프로토콜",short:"GHG 프로토콜",who:"측정 · 산정 실무",desc:"조직경계, 기준연도 재산정, Scope 2 지침, Scope 3 15개 카테고리와 산정 방법."},
 {id:"lca",g:"meas",name:"LCA · 제품 탄소발자국",short:"LCA",who:"측정 · 제품",desc:"ISO 14040/44/67, 기능단위, 할당, EPD와 환경성적표지, 배터리 규정 탄소발자국."},
 {id:"assurance",g:"meas",name:"제3자 검증·인증",short:"검증",who:"측정 · 신뢰성",desc:"제한적·합리적 보증, ISAE 3000/3410, ISSA 5000, ISO 14064-3, 중요성 기준."},
 {id:"physical",g:"meas",name:"물리적 위험·기후과학",short:"물리 위험",who:"위험 · 과학 기초",desc:"IPCC AR6, 재해 유형, 위험 평가 방법, 적응과 자산 노출 산정."},
 {id:"scenario",g:"meas",name:"시나리오 분석·재무영향",short:"시나리오",who:"전략 · 재무영향",desc:"IEA·NGFS·IPCC 시나리오, 탄소가격 가정, 재무영향 경로와 흔한 실수."},
 // 제도·시장
 {id:"korea",g:"reg",name:"국내 기후 제도",short:"국내 제도",who:"제도 · 배출권거래제",desc:"탄소중립기본법, 배출권거래제 할당·MRV·과징금, 목표관리제, 국가 배출계수."},
 {id:"markets",g:"reg",name:"탄소시장 · CBAM",short:"탄소시장",who:"제도 · 국제",desc:"EU ETS, CBAM 본격 시행, 파리협정 6조, 자발적 탄소시장과 크레딧 품질."},
 {id:"targets",g:"reg",name:"감축목표 · 전환계획",short:"목표·전환",who:"전략 · SBTi",desc:"SBTi 넷제로 기준, 1.5℃ 경로, 전환계획 요소, 크레딧 사용 규칙."},
 {id:"finance",g:"reg",name:"금융배출량 · 택소노미",short:"금융",who:"금융 · 그린워싱",desc:"PCAF, 택소노미(EU·K), 녹색채권, 그린워싱 규제."},
 // 실무·평가
 {id:"ratings",g:"prac",name:"ESG 평가 대응",short:"ESG 평가",who:"평가기관 대응",desc:"CDP, EcoVadis, S&P CSA, KCGS가 무엇을 보고 어떻게 점수를 매기는지."},
 {id:"practice",g:"prac",name:"보고서 작성 실무",short:"작성 실무",who:"컨설턴트 워크플로",desc:"보고 범위·기준·재작성, 데이터 수집과 오류, 색인표, 검증 준비, 연간 일정."}
];
const GROUPS={map:{name:"지도",color:"ratings"},std:{name:"공시 기준",color:"ifrs"},meas:{name:"측정·검증",color:"esrs"},reg:{name:"제도·시장",color:"kssb"},prac:{name:"실무·평가",color:"gri-sasb"}};
MODS.forEach(m=>m.color=GROUPS[m.g].color);
const LESSONS={};const v2=[];
for(const m of MODS){
  if(["ifrs","kssb","esrs","gri-sasb","ratings"].includes(m.id))continue;
  const d=load(R("data/modules/"+m.id+".json"));if(!d){m.missing=true;continue}
  LESSONS[m.id]=d.lesson;
  (d.items||[]).forEach(x=>{x.module=m.id;if(!x.level)x.level=2;if(!x.tags)x.tags=[x.topic];v2.push(x)});
}
const ITEMS=[...ifrs,...v1,...v2].filter(x=>MODS.some(m=>m.id===x.module));
// sanity
const ids=new Set();const bad=[];
ITEMS.forEach(x=>{if(ids.has(x.id))bad.push("dup "+x.id);ids.add(x.id);
  if(!["judge","mc","calc"].includes(x.type))bad.push("type "+x.id);
  if(x.type==="judge"&&(!["있음","일부","없음"].includes(x.ans)||!x.page))bad.push("judge "+x.id);
  if(x.type==="mc"&&!(x.options&&x.options.length>=2&&x.options[x.ans]!==undefined))bad.push("mc "+x.id);
  if(x.type==="calc"&&(typeof x.ans!=="number"||!x.steps))bad.push("calc "+x.id);
  if(![1,2,3].includes(x.level))x.level=2;});
if(bad.length){console.error(bad);process.exit(1)}
const MAP=(load(R("data/v1/mapping.json"))||[]).map((m,i)=>{const key=["scope1","scope2","scope3","targets","transition","scenario","icp","pay"][i];
  const plain=s=>String(s||"").replace(/이에요\./g,"이다.").replace(/예요\./g,"다.").replace(/해요\./g,"한다.").replace(/있어요\./g,"있다.").replace(/돼요\./g,"된다.").replace(/게 해요/g,"게 한다").replace(/쳐요\./g,"친다.").replace(/요\./g,".").replace(/요$/,"");
  const [esrs,...rest]=String(m.esrs).split(/\s*\/\s*(?=간소화 ESRS)/);
  const SHORT={scope3:{ifrs:"29(a)(vi) 카테고리 명시",kssb:"Scope 3 공시 3년 유예",esrs:"E1-6 ¶51 → 개정 E1-8",gri:"305-3 → 102-7 (2027~)",cdp:"질문 7.8"}};
  return Object.assign({},m,{key,kssb:String(m.kssb).replace("IFRS S2와 동일 구조(문단 번호 확인 필요)","IFRS S2와 같은 구조 (확인 필요)"),esrs,esrsNote:rest.join(" / "),plain:plain(m.plain),diff:plain(m.diff),hyundai:{page:+(String(m.hyundai.page).match(/\d+/)||[38])[0],pageLabel:m.hyundai.page,fact:m.hyundai.fact},short:SHORT[key]||null})});
const data=`const MODS=${JSON.stringify(MODS)};\nconst GROUPS=${JSON.stringify(GROUPS)};\nconst LESSONS=${JSON.stringify(LESSONS)};\nconst ITEMS=${JSON.stringify(ITEMS)};\nconst MAP=${JSON.stringify(MAP)};`;
const page=fs.readFileSync(path.join(__dirname,"page.html"),"utf8");
const style=fs.readFileSync(path.join(__dirname,"style.css"),"utf8").replace("</style>",fs.readFileSync(path.join(__dirname,"extra.css"),"utf8")+"</style>");
const out=page.replace("/*STYLE*/",()=>style).replace("/*DATA*/",()=>data);
fs.writeFileSync(path.join(__dirname,"..","index.html"),out);
fs.writeFileSync(path.join(__dirname,"..","test.html"),'<meta charset="utf-8">'+out);
const by={};ITEMS.forEach(x=>{by[x.module]=by[x.module]||{n:0,l:[0,0,0,0]};by[x.module].n++;by[x.module].l[x.level]++});
console.log("items",ITEMS.length,"modules",MODS.filter(m=>!m.missing).length,"missing",MODS.filter(m=>m.missing).map(m=>m.id).join(","));
console.log(Object.entries(by).map(([k,v])=>`${k}:${v.n}(${v.l.slice(1).join("/")})`).join(" "));
