// 원문 읽기 — 정의서 v5. 기준서 하나 = 확장팩 하나(packs/<id>/pack.json).
// 새 기준서는 packs/에 폴더 하나와 packs.json 한 줄만 더하면 된다. 서버 없음, 기록은 localStorage.
"use strict";
const KEY = "reading-v1";
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const PACKS = {};      // id → pack.json + base 경로
let ORDER = [];        // 서재 순서
let CATS = [];         // 분야 4개 (packs.json)
const PDF_OK = {};

// ── 저장: { version, packs: { <packId>: { items: { <itemId>: {done, doneAt, note, tree, cases} } } } } ──
function load() {
  try { const o = JSON.parse(localStorage.getItem(KEY)); if (o && o.packs) return o; } catch (e) {}
  return { version: 1, packs: {} };
}
let S = load();
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
const recs = p => ((S.packs[p] ||= { items: {} }).items);
const rec = (p, id) => (recs(p)[id] ||= { done: false, doneAt: null, note: "", tree: "", cases: [] });
const isDone = (p, id) => !!(S.packs[p] && S.packs[p].items[id] && S.packs[p].items[id].done);

// ── 도우미 ──
const pages = r => r.start === r.end ? `${r.start}쪽` : `${r.start}~${r.end}쪽`;
const short = (P, doc) => P.docs[doc].short;
const fileOf = (P, doc) => P.base + P.docs[doc].file;
const pdfUrl = (P, doc, page) => `${fileOf(P, doc)}#page=${page}`;
const doneCount = P => P.items.filter(i => isDone(P.id, i.id)).length;
const nextItem = P => P.items.find(i => !isDone(P.id, i.id)) || P.items[P.items.length - 1];
const fmtDate = iso => { const d = new Date(iso); return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`; };
const isReady = P => P.status !== "prep";
const badge = (P, cls = "") => `<span class="code ${cls}">${esc(P.code)}</span>`;

async function checkPdf(P, doc) {
  const f = fileOf(P, doc);
  if (f in PDF_OK) return PDF_OK[f];
  try { PDF_OK[f] = (await fetch(f, { method: "HEAD" })).ok; } catch (e) { PDF_OK[f] = false; }
  return PDF_OK[f];
}

// ── 서재 (#/) ──
function shelf() {
  $("#app").innerHTML = `<div class="view">
    <p class="eyebrow">기후·온실가스 기준서</p>
    <h1 class="h1">기준서를 원문으로, 하나씩.</h1>
    <p class="lead">네 분야의 기준서를 한 권씩 끝까지 읽고 다음 권으로 넘어가.</p>
    ${(() => { const P = PACKS[ORDER.find(id => isReady(PACKS[id]))]; if (!P) return ""; const nx = nextItem(P);
      return `<a class="now" href="#/p/${P.id}/read/${nx.id}"><span class="now-l">지금 읽는 중</span>${badge(P)}<b>${esc(nx.title)}</b><span class="now-p">${doneCount(P)} / ${P.items.length}</span><span class="now-go">이어 읽기 →</span></a>`; })()}
    <nav class="cats" aria-label="분야">${CATS.map(c => {
      const n = ORDER.filter(id => PACKS[id].category === c.id).length;
      return `<a href="#cat-${c.id}" data-cat="${c.id}" class="${n ? "has" : ""}"><b>${esc(c.label)}</b><span>${n ? `기준서 ${n}` : "준비 중"}</span></a>`;
    }).join("")}</nav>
    ${CATS.map(c => {
      const ps = ORDER.filter(id => PACKS[id].category === c.id).map(id => PACKS[id]);
      return `<section class="cat" id="cat-${c.id}"><div class="cat-h"><h2>${esc(c.label)}</h2><p>${esc(c.desc)}</p></div>
        ${ps.length ? `<div class="shelf">${ps.map(packCard).join("")}</div>${c.candidates.length ? `<p class="more">다음 후보 ${c.candidates.map(x => `<span class="cand">${esc(x)}</span>`).join("")}</p>` : ""}`
          : `<div class="slot"><span class="code ghost">+</span><div><b>아직 꽂힌 기준서가 없어</b><p>후보 ${c.candidates.map(x => `<span class="cand">${esc(x)}</span>`).join("")}</p></div></div>`}
      </section>`;
    }).join("")}
  </div>`;
  document.querySelectorAll(".cats a").forEach(a => a.onclick = e => { e.preventDefault(); document.getElementById("cat-" + a.dataset.cat).scrollIntoView({ behavior: "smooth", block: "start" }); });
}
function packCard(P) {
  const top = `<div class="pack-top">${badge(P, "lg")}<div><p class="kind-l">${esc(P.kind)} · ${esc(P.edition)}</p><h2>${esc(P.name)}</h2><p class="issuer">${esc(P.issuer)}</p></div></div>`;
  if (!isReady(P)) return `<article class="pack prep">${top}
    <p class="prep-note"><span class="pill">목차 준비됨</span>항목 ${P.items.length}개 · 원문 PDF와 쪽수 검수 전</p>
    <div class="pack-act"><a class="btn" href="#/p/${P.id}">목차 보기</a></div></article>`;
  const n = doneCount(P), t = P.items.length, nx = nextItem(P);
  return `<article class="pack">${top}
    <div class="prog"><div class="bar2"><i style="width:${n / t * 100}%"></i></div><span><b>${n}</b> / ${t} 항목</span></div>
    <div class="pack-act"><a class="btn main" href="#/p/${P.id}/read/${nx.id}">이어 읽기 — ${esc(nx.title)}</a><a class="btn" href="#/p/${P.id}">목차 보기</a></div>
  </article>`;
}

// ── 확장팩 첫 화면 (#/p/<id>): 이어 읽기 하나 + 전체 지도 ──
function weekInfo(P) {
  const st = S.packs[P.id] && S.packs[P.id].startedAt;
  if (!st) return { week: 0, text: "아직 시작 전" };
  const week = Math.floor((Date.now() - new Date(st)) / 864e5 / 7) + 1;
  return { week, text: `${week}주차 · ${fmtDate(st)} 시작` };
}
function packHome(P) {
  const ready = isReady(P), n = doneCount(P), t = P.items.length, nx = nextItem(P);
  const cat = CATS.find(c => c.id === P.category) || {};
  const wk = weekInfo(P);
  const plan = (P.schedule || []).map(s => `<li class="${wk.week >= s.from && wk.week <= s.to ? "on" : ""}"><b>${s.from}~${s.to}주차</b>${esc(s.label)}</li>`).join("");
  const nxPart = P.parts.find(x => x.id === nx.part);
  $("#app").innerHTML = `<div class="view">
    <p class="crumb"><a href="#/">서재</a> › ${esc(cat.label || "")}</p>
    <div class="phead">${badge(P, "lg")}<div><h1 class="ptitle">${esc(P.name)}</h1>
      <p class="pmeta">${esc(P.edition)} · ${esc(P.issuer)} · 원문 ${Object.values(P.docs).map(d => `<a href="${esc(d.url)}" target="_blank" rel="noopener">${esc(d.short)} ↗</a>`).join(" ")}</p></div></div>
    ${ready ? `<section class="hero">
      <div class="hero-main"><p class="hero-k">다음에 읽을 곳 · ${esc(nxPart ? nxPart.label : "")}</p>
        <h2>${esc(nx.title)}</h2><p class="hero-map">${esc(nx.map)}</p>
        <a class="btn main big" href="#/p/${P.id}/read/${nx.id}">이어 읽기 →</a></div>
      <div class="hero-side">
        <div class="ring" style="--p:${n / t * 100}"><div><b>${n}</b><span>/ ${t}</span></div></div>
        <p class="wk">${esc(wk.text)}</p>
        ${plan ? `<ul class="plan">${plan}</ul>` : ""}
      </div></section>`
      : `<section class="prep-box"><span class="pill">목차 준비됨</span><p>목차는 나눠 뒀어. 원문 PDF를 넣고 쪽수를 검수하면 읽을 수 있어. 지금은 <b>${esc(PACKS[ORDER.find(id => isReady(PACKS[id]))]?.code || "")}</b>를 읽는 중이야.</p></section>`}
    <section class="atlas"><div class="sh"><h2>전체 지도</h2><span>${ready ? "누르면 그 항목을 읽어" : "항목 이름과 원문 범위"}</span></div>
      ${P.parts.map(part => {
        const its = P.items.filter(i => i.part === part.id), d = its.filter(i => isDone(P.id, i.id)).length;
        return `<div class="apart"><div class="apart-h"><b>${esc(part.label)}</b><span>${ready ? `${d} / ${its.length}` : `${its.length}개`}</span></div>
          <div class="tiles">${its.map(it => {
            const no = P.items.indexOf(it) + 1, dn = isDone(P.id, it.id), isNext = ready && it.id === nx.id && !dn;
            const r0 = it.ranges[0];
            const sub = ready ? `${esc(short(P, r0.doc))} ${esc(r0.label)} · ${pages(r0)}${it.ranges.length > 1 ? ` 외 ${it.ranges.length - 1}곳` : ""}` : `${esc(it.rangeText || "")}`;
            const stat = dn ? `<span class="tst ok">✓ ${fmtDate(recs(P.id)[it.id].doneAt)}</span>` : isNext ? `<span class="tst nx">다음</span>` : "";
            const inner = `<span class="tno">${no}</span><span class="ttl">${esc(it.title)}</span><span class="tsub">${sub}</span>${stat}`;
            return ready ? `<a class="tile ${dn ? "done" : ""} ${isNext ? "next" : ""}" href="#/p/${P.id}/read/${it.id}">${inner}</a>` : `<div class="tile off">${inner}</div>`;
          }).join("")}</div></div>`;
      }).join("")}
    </section></div>`;
}

// ── 오늘의 읽기 (#/p/<id>/read/<item>) ──
const STEP_NAMES = ["지도", "원문", "내 정리", "상황 문제"];
const READY_STEPS = 2; // 3·4단계는 다음 작업에서
let VIEW = { key: null, step: 1, part: 0 };

function read(P, id, step) {
  const idx = P.items.findIndex(i => i.id === id);
  if (idx < 0) { location.hash = `#/p/${P.id}`; return; }
  const key = P.id + "/" + id;
  if (VIEW.key !== key) VIEW = { key, step: 1, part: 0 };
  if (step) VIEW.step = Math.min(Math.max(1, step), READY_STEPS);
  const it = P.items[idx], r = recs(P.id)[id];
  const part = P.parts.find(x => x.id === it.part);
  $("#app").innerHTML = `<div class="view">
    <div class="rhead">
      <div><p class="crumb">${badge(P)} ${esc(part.label)} · ${idx + 1} / ${P.items.length}</p>
        <h1 class="rtitle">${esc(it.title)}${r && r.done ? `<span class="done-tag">✓ ${fmtDate(r.doneAt)} 다 읽음</span>` : ""}</h1></div>
      <ol class="steps" aria-label="단계">${STEP_NAMES.map((s, i) => {
        const n = i + 1, cls = n === VIEW.step ? "on" : n < VIEW.step ? "past" : n > READY_STEPS ? "later" : "";
        return `<li class="${cls}" ${n === VIEW.step ? 'aria-current="step"' : ""}><b>${n}</b>${s}</li>`;
      }).join("")}</ol>
    </div>
    <section class="panel" id="stage"></section>
    <div class="foot">
      <button class="btn" id="prev" type="button" ${VIEW.step === 1 ? "disabled" : ""}>← 이전</button>
      <span class="mid">${VIEW.step === 2 ? "다 읽으면 체크해 둬. 내 정리와 상황 문제는 다음 작업에서 붙어." : ""}</span>
      ${VIEW.step === 1
        ? `<button class="btn main" id="next" type="button">원문 읽으러 가기 →</button>`
        : `<button class="btn main ${r && r.done ? "ok" : ""}" id="doneBtn" type="button">${r && r.done ? "✓ 다 읽었어요 (취소하려면 누르기)" : "다 읽었어요"}</button>`}
    </div></div>`;
  VIEW.step === 1 ? stageMap(P, it) : stagePdf(P, it);
  $("#prev").onclick = () => read(P, id, VIEW.step - 1);
  const nx = $("#next"); if (nx) nx.onclick = () => read(P, id, 2);
  const db = $("#doneBtn"); if (db) db.onclick = () => {
    const x = rec(P.id, id); x.done = !x.done; if (x.done && !S.packs[P.id].startedAt) S.packs[P.id].startedAt = new Date().toISOString(); x.doneAt = x.done ? new Date().toISOString() : null; save(); read(P, id);
  };
}

function stageMap(P, it) {
  const grp = part => `<div class="grp"><span>${esc(part.label)}</span><div class="dots">${P.items.filter(x => x.part === part.id).map(x =>
    `<a href="#/p/${P.id}/read/${x.id}" title="${esc(x.title)}" aria-label="${esc(x.title)}" class="${x.id === it.id ? "cur" : isDone(P.id, x.id) ? "done" : ""}"></a>`).join("")}</div></div>`;
  const total = it.ranges.reduce((a, r) => a + (r.end - r.start + 1), 0);
  $("#stage").innerHTML = `<div class="mapbox">
    <p class="where">${esc(P.code)} 전체에서 여기</p>
    <div class="track">${P.parts.map(grp).join("")}</div>
    <p class="mapline">${esc(it.map)}</p>
    <div class="toread"><h3>오늘 읽을 곳</h3>
      ${it.ranges.map(r => `<div class="rrow"><span class="kind ${esc(r.kind)}">${esc(r.kind)}</span>
        <span class="lb">${esc(short(P, r.doc))} ${esc(r.label)}${r.by ? `<small>${esc(r.by)}이 이 부분을 가리킨다</small>` : ""}</span><span class="pg">${pages(r)}</span></div>`).join("")}
    </div>
    <p class="total">모두 약 ${total}쪽</p>
    ${it.refs.length ? `<p class="refs"><b>참고로 열어 볼 곳</b> · ${it.refs.map(r => `${esc(r.label)} (${pages(r)}, ${esc(r.by)})`).join(" · ")} — 다른 항목에서 읽는 부분이라 진도에는 넣지 않았어.</p>` : ""}
  </div>`;
}

async function stagePdf(P, it) {
  const parts = [...it.ranges.map(r => ({ ...r, ref: false })), ...it.refs.map(r => ({ ...r, ref: true }))];
  const cur = parts[VIEW.part] || parts[0];
  const doc = P.docs[cur.doc], gl = doc.glossary;
  const ok = await checkPdf(P, cur.doc);
  $("#stage").innerHTML = `<div class="reader">
    <div class="side"><h3>읽을 곳</h3>
      ${parts.map((p, i) => p.ref ? "" : `<button class="part ${i === VIEW.part ? "on" : ""}" data-i="${i}" type="button"><span class="lb">${esc(short(P, p.doc))} ${esc(p.label)}</span><span class="pg">${pages(p)}</span></button>`).join("")}
      ${it.refs.length ? `<p class="sm">참고</p>${parts.map((p, i) => p.ref ? `<button class="ref" data-i="${i}" type="button">${esc(p.label)} · ${pages(p)}</button>` : "").join("")}` : ""}
      ${gl ? `<button class="gl" id="gloss" type="button">${esc(doc.short)} 용어 보기 (${pages(gl)})</button>` : ""}
    </div>
    <div class="pdfwrap">
      <div class="pdftop"><span>${esc(doc.short)} ${esc(cur.label)} · ${pages(cur)}</span><a href="${pdfUrl(P, cur.doc, cur.start)}" target="_blank" rel="noopener">새 창으로 크게 보기 ↗</a></div>
      ${ok ? `<iframe class="pdf" id="pdf" title="${esc(P.code)} ${esc(doc.short)} 원문" src="${pdfUrl(P, cur.doc, cur.start)}"></iframe>`
           : `<div class="missing"><div><p><b>원문 PDF가 아직 없어.</b></p><p>${esc(fileOf(P, cur.doc))} 자리에 파일을 넣어 줘.</p><p><a href="${esc(doc.url)}" target="_blank" rel="noopener">공식 원문 받기 ↗</a></p></div></div>`}
      <p class="src">출처: ${esc(P.issuer)}, ${esc(P.name)} ${esc(P.edition)} · <a href="${esc(doc.url)}" target="_blank" rel="noopener">공식 원문</a></p>
    </div></div>`;
  document.querySelectorAll("[data-i]").forEach(b => b.onclick = () => { VIEW.part = +b.dataset.i; stagePdf(P, it); });
  const g = $("#gloss"); if (g) g.onclick = () => { const f = $("#pdf"); if (f) f.src = pdfUrl(P, cur.doc, gl.start) + "&t=" + Date.now(); };
}

// ── 내 기록 (6단계에서 만든다) ──
function notes() { $("#app").innerHTML = `<div class="view temp"><h1>내 기록</h1><p>6단계에서 만든다. 확장팩별로 모아 보게 될 거야.</p></div>`; }

// ── 길 찾기: #/  #/p/<pack>  #/p/<pack>/read/<item>  #/notes ──
function route() {
  const seg = (location.hash || "#/").slice(2).split("/");
  const P = seg[0] === "p" ? PACKS[seg[1]] : null;
  document.querySelectorAll("[data-nav]").forEach(x => x.classList.toggle("on", x.dataset.nav === (seg[0] === "notes" ? "notes" : !seg[0] ? "shelf" : "")));
  $("#packnav").innerHTML = P ? `<span class="sep">/</span><span class="catn">${esc((CATS.find(c => c.id === P.category) || {}).label || "")}</span><span class="sep">/</span><a href="#/p/${P.id}">${badge(P, "sm")} ${esc(P.name)}</a>` : "";
  if (P && seg[2] === "read" && isReady(P)) read(P, seg[3]);
  else if (P) packHome(P);
  else if (seg[0] === "notes") notes();
  else shelf();
  scrollTo(0, 0);
}

(async () => {
  try {
    const list = await (await fetch("packs.json")).json();
    for (const p of list.packs) {
      const P = await (await fetch(p.path + "pack.json")).json();
      P.base = p.path; P.category = p.category; PACKS[P.id] = P; ORDER.push(P.id);
    }
    CATS = list.categories || [];
    addEventListener("hashchange", route); route();
  } catch (e) {
    $("#app").innerHTML = `<div class="view temp"><h1>목차를 못 불러왔어</h1><p>파일을 직접 열면(file://) 브라우저가 막아. 폴더에서 <code>python3 -m http.server</code>를 켜고 열어 줘.</p></div>`;
  }
})();
