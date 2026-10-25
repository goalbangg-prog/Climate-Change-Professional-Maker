// 기후공시 리딩 클래스 빌드: src/reading.html + data/books/*.json + 문항 → index.html
// 먼저 node src/build.js 를 돌려 legacy.html 과 data/items.gen.json 을 만든다.
const fs=require("fs"),path=require("path");
const R=p=>path.join(__dirname,"..",p);
const J=f=>JSON.parse(fs.readFileSync(R(f),"utf8"));

const DATA={
  kssb:[...J("data/books/kssb-1.json").sessions,...J("data/books/kssb-2.json").sessions],
  s2:J("data/books/ifrs-s2.json").sessions
};
// 공통 기초 책 (있을 때만)
if(fs.existsSync(R("data/books/base-1.json")))DATA.b1=J("data/books/base-1.json").sessions;
if(fs.existsSync(R("data/books/base-3.json")))DATA.b3=J("data/books/base-3.json").sessions;
if(fs.existsSync(R("data/books/base-2.json")))DATA.b2=J("data/books/base-2.json").sessions;
// 손으로 고른 '더 풀어 보기' (있으면 자동 선택보다 우선)
if(fs.existsSync(R("data/books/mrv.json")))DATA.mrv=J("data/books/mrv.json").sessions;
if(fs.existsSync(R("data/books/ver.json")))DATA.ver=J("data/books/ver.json").sessions;
for(const [k,fn] of [["s1","ifrs-s1"],["tms","tms"],["envinfo","envinfo"],["ghgp-s2","ghgp-s2"],["ghgp-s3","ghgp-s3"],["ghgp-corp","ghgp-corp"]])if(fs.existsSync(R("data/books/"+fn+".json")))DATA[k]=J("data/books/"+fn+".json").sessions;
const CURATED=fs.existsSync(R("data/books/drill.json"))?J("data/books/drill.json"):{};
const ITEMS=J("data/items.gen.json");
const DIAG=J("data/diagnostic.json");

/* ---- 회차별 '더 풀어 보기' 문항 고르기 ---- */
// 회차 → 문항 모듈. 같은 주제의 기존 문항만 고른다.
const MODMAP=id=>{
  if(id.startsWith("b1-"))return ["ghgp"];
  if(id.startsWith("b3-"))return ["physical","scenario"];
  if(id.startsWith("m-"))return ["korea","ghgp"];
  if(id.startsWith("s1-"))return ["ifrs-s1","kssb"];
  if(id.startsWith("t-"))return ["korea"];
  if(id.startsWith("e-"))return ["finance","korea"];
  if(id.startsWith("p2-")||id.startsWith("pc-"))return ["ghgp"];
  if(id.startsWith("p3-"))return ["ghgp","kia","ifrs"];
  if(id.startsWith("v-"))return ["assurance","korea"];
  if(id.startsWith("b2-"))return ["korea","markets","kssb"];
  if(id==="k0"||id==="k1-11"||id==="k2-11"||id==="s2-0"||id==="s2-11")return ["kssb","ifrs-s1"];
  if(id.startsWith("k1-"))return ["ifrs-s1"];
  const n=+id.split("-").pop();
  if(n>=1&&n<=7)return ["ifrs-s2x","scenario"];
  if(n===8)return ["ifrs","ghgp","kia"];
  if(n===9)return ["ifrs","ifrs-s2x","kia"];
  if(n===10)return ["targets","ifrs"];
  return ["kssb"];
};
const words=t=>new Set((String(t).match(/[가-힣A-Za-z0-9]{2,}/g)||[]).filter(w=>!/^(문단|이다|한다|있다|하는|대한|따라|기업|공시|정보|경우|그리고|또는)$/.test(w)));
const used=new Set();const DRILL={};
for(const bid in DATA)for(const s of DATA[bid]){
  const key=words([s.title,s.intro,...s.blocks.map(b=>b.label+" "+b.req)].join(" "));
  const mods=MODMAP(s.id);
  const pool=ITEMS.filter(x=>mods.includes(x.module)&&(x.type==="mc"||(x.type==="judge"&&x.quote)))
    .map(x=>{const w=words([x.q,x.topic,(x.tags||[]).join(" "),x.ref].join(" "));let sc=0;w.forEach(k=>{if(key.has(k))sc++});return {x,sc:sc-(used.has(x.id)?3:0)-(x.type==="judge"?0.5:0)}})
    .filter(o=>o.sc>=2).sort((a,b)=>b.sc-a.sc||a.x.level-b.x.level);
  const pick=pool.slice(0,4).map(o=>o.x);pick.forEach(x=>used.add(x.id));
  DRILL[s.id]=pick.map(x=>x.id);
}
const known=new Set(ITEMS.map(x=>x.id));
for(const id in CURATED)if(DRILL[id]!==undefined)DRILL[id]=CURATED[id].filter(x=>known.has(x));
const need=new Set(Object.values(DRILL).flat());
const BANK=ITEMS.filter(x=>need.has(x.id)).map(x=>{const o={id:x.id,type:x.type,q:x.q,ref:x.ref,why:x.why,trap:x.trap};
  if(x.type==="mc"){o.options=x.options;o.ans=x.ans}
  else{o.options=["있음","일부","없음"];o.ans=["있음","일부","없음"].indexOf(x.ans);o.quote=x.quote;o.page=x.page;o.co=x.co||"hyundai";o.look=x.look}
  const src=(x.sources||[]).find(s=>/^https?:/.test(s.url));if(src)o.src={label:src.label,url:src.url};
  return o}).filter(o=>o.ans>=0);

/* ---- 원본 도감·개정 이력·핵심 회차·문단 계보 ---- */
const SOURCES=J("data/sources.json").items;
const CHANGES=J("data/changes.json").items;
const CORE=Object.fromEntries(Object.entries(J("data/core.json")).filter(([k])=>!k.startsWith("_")));
const LINEAGE=J("data/lineage.json");
const allIds=new Set(Object.values(DATA).flat().map(s=>s.id));
// 참조 검사: 틀린 id가 있으면 빌드를 멈춘다
for(const st of LINEAGE.strands)for(const br of st.branches){const ids=new Set(br.nodes.map(n=>n.id));
  for(const n of br.nodes){const s=Object.values(DATA).flat().find(x=>x.id===n.sid);if(!s||!s.blocks[n.bi])throw new Error("계보 노드 "+n.id)}
  for(const e of br.edges)if(!ids.has(e.f)||!ids.has(e.t)||!allIds.has(e.at))throw new Error("계보 선 "+e.f+"→"+e.t)}
for(const c of CHANGES)if(c.at&&!allIds.has(c.at))throw new Error("개정 이력 회차 "+c.at);
for(const b in CORE)for(const id in CORE[b])if(!allIds.has(id))throw new Error("핵심 회차 "+id);

/* ---- 정정 기록: data/books/REVIEW-*.md 에서 '고친 것' 표와 '확인 필요' 항목을 센다 ---- */
const RMAP={"base-1":"b1","base-2":"b2","base-3":"b3","kssb-1":"kssb","kssb-2":"kssb","ifrs-s1":"s1","ifrs-s2":"s2"};
const clean=t=>String(t).replace(/\*\*|`/g,"").replace(/\s+/g," ").trim();
const REVIEWS={};
for(const f of fs.readdirSync(R("data/books")).filter(f=>/^REVIEW-.+\.md$/.test(f)&&f!=="REVIEW_BRIEF.md")){
  const key=f.slice(7,-3);const bid=RMAP[key]||key;if(!DATA[bid])continue;
  const t=fs.readFileSync(R("data/books/"+f),"utf8");
  const date=(t.match(/검수일 (\d{4}-\d\d-\d\d)/)||[])[1]||"";
  const fixes=[];let need=0;
  for(const sec of t.split(/\n## /).slice(1)){
    const head=sec.split("\n",1)[0];const lines=sec.split("\n").slice(1);
    const rows=lines.filter(l=>l.startsWith("|")&&!/^\|\s*:?-/.test(l)).map(l=>l.split("|").slice(1,-1).map(clean));
    if(/고친/.test(head)&&rows.length>1){const h=rows[0];const wi=h.findIndex(x=>/근거/.test(x));const bi=h.findIndex(x=>/^블록$/.test(x));
      rows.slice(1).forEach(r=>fixes.push({at:bi>0?r[0]+" · "+r[bi]:r[0],why:wi>=0?r[wi]:r[r.length-1]}))}
    if(/확인 필요/.test(head))need+=rows.length>1?rows.length-1:lines.filter(l=>/^(\d+\.|-)\s/.test(l)).length;
  }
  const o=REVIEWS[bid]||(REVIEWS[bid]={date:"",fixes:[],need:0,files:[]});
  o.date=o.date>date?o.date:date;o.fixes.push(...fixes);o.need+=need;o.files.push(f);
}

const page=fs.readFileSync(path.join(__dirname,"reading.html"),"utf8");
const js=o=>JSON.stringify(o).replace(/<\//g,"<\\/");
const out=page.replace("__DATA__",()=>js(DATA)).replace("__DRILL__",()=>js(DRILL)).replace("__BANK__",()=>js(BANK)).replace("__DIAG__",()=>js(DIAG))
  .replace("__SOURCES__",()=>js(SOURCES)).replace("__CHANGES__",()=>js(CHANGES)).replace("__CORE__",()=>js(CORE)).replace("__LINEAGE__",()=>js(LINEAGE)).replace("__REVIEWS__",()=>js(REVIEWS))
  .replaceAll("__BUILT__",new Date().toISOString().slice(0,10));
fs.writeFileSync(R("index.html"),out);
const cnt=Object.values(DRILL).map(a=>a.length);
console.log("sessions",Object.values(DATA).flat().length,"bank",BANK.length,"drill per session min/avg",Math.min(...cnt),(cnt.reduce((a,b)=>a+b,0)/cnt.length).toFixed(1),"empty",Object.entries(DRILL).filter(([k,v])=>!v.length).map(([k])=>k).join(","),"size",out.length);
