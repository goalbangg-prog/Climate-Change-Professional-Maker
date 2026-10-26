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
// 공개 기록: log/public.json (저장소에 올린 김수현의 기록). 내 기록이 없으면 이걸 보여 준다.
let PUB = null, PUBMODE = false;
const store = () => PUBMODE && PUB ? PUB : S;
const recs = p => ((store().packs[p] ||= { items: {} }).items);
const hasOwn = () => Object.values(S.packs).some(pk => Object.values(pk.items || {}).some(r => r && (r.done || r.note || r.tree || (r.cases || []).some(c => c.q || c.a))));
// 쓰기는 늘 내 기록에. 공개 기록을 보다가 쓰기 시작하면 내 기록으로 바뀐다.
const rec = (p, id) => { if (PUBMODE) { PUBMODE = false; pubBar(); } return ((S.packs[p] ||= { items: {} }).items[id] ||= { done: false, doneAt: null, note: "", tree: "", cases: [] }); };
const isDone = (p, id) => { const st = store(); return !!(st.packs[p] && st.packs[p].items[id] && st.packs[p].items[id].done); };

// ── 도우미 ──
const pages = r => r.start === r.end ? `${r.start}쪽` : `${r.start}~${r.end}쪽`;
const short = (P, doc) => P.docs[doc].short;
const fileOf = (P, doc) => P.base + P.docs[doc].file;
// 크롬: view=FitH(폭 맞춤), navpanes=0(썸네일 숨김) / 파이어폭스: zoom=page-width, pagemode=none
const pdfUrl = (P, doc, page) => `${fileOf(P, doc)}#page=${page}&zoom=page-width&view=FitH&navpanes=0&pagemode=none`;
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
    ${nowCard()}
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
// 서재 맨 위: 지금 읽는 기준서 (목차 화면의 요약판)
function dotMap(P, cur) {
  return `<div class="dotmap">${P.parts.map(part => `<div class="grp"><span>${esc(part.label)}</span><div class="dots">${P.items.filter(x => x.part === part.id).map(x =>
    `<i class="${x.id === cur ? "cur" : isDone(P.id, x.id) ? "done" : ""}" title="${esc(x.title)}"></i>`).join("")}</div></div>`).join("")}</div>`;
}
function nowCard() {
  const P = PACKS[ORDER.find(id => isReady(PACKS[id]))]; if (!P) return "";
  const n = doneCount(P), t = P.items.length, nx = nextItem(P), wk = weekInfo(P);
  return `<section class="nowcard" aria-label="지금 읽는 기준서">
    <div class="nc-main"><p class="hero-k">지금 읽는 기준서 · ${badge(P)} ${esc(P.name)}</p>
      <h2>${esc(nx.title)}</h2><p class="hero-map">${esc(nx.map)}</p>
      <div class="nc-act"><a class="btn main big" href="#/p/${P.id}/read/${nx.id}">이어 읽기 →</a><a class="linkbtn" href="#/p/${P.id}">목차 보기 →</a></div></div>
    <a class="nc-side" href="#/p/${P.id}" aria-label="${esc(P.code)} 목차 보기">
      <div class="ring" style="--p:${n / t * 100}"><div><b>${n}</b><span>/ ${t}</span></div></div>
      <p class="wk">${esc(wk.text)}</p>${dotMap(P, nx.id)}</a>
  </section>`;
}
// 분야 안의 기준서 카드: 목차 화면으로 가는 문
function packCard(P) {
  const top = `<div class="pack-top">${badge(P, "lg")}<div><p class="kind-l">${esc(P.kind)} · ${esc(P.edition)}</p><h2>${esc(P.name)}</h2><p class="issuer">${esc(P.issuer)}</p></div></div>`;
  if (!isReady(P)) return `<a class="pack prep" href="#/p/${P.id}">${top}
    <p class="prep-note"><span class="pill">목차 준비됨</span>항목 ${P.items.length}개 · 원문 PDF와 쪽수 검수 전<span class="go">목차 보기 →</span></p></a>`;
  const n = doneCount(P), t = P.items.length;
  return `<a class="pack" href="#/p/${P.id}">${top}
    <div class="prog"><div class="bar2"><i style="width:${n / t * 100}%"></i></div><span><b>${n}</b> / ${t} 항목</span><span class="go">목차 보기 →</span></div></a>`;
}

// ── 확장팩 첫 화면 (#/p/<id>): 이어 읽기 하나 + 전체 지도 ──
function weekInfo(P) {
  const st = store().packs[P.id] && store().packs[P.id].startedAt;
  if (!st) return { week: 0, text: "아직 시작 전" };
  const week = Math.max(1, Math.floor((Date.now() - new Date(st)) / 864e5 / 7) + 1);
  return { week, text: `${week}주차 · ${fmtDate(st)} 시작` };
}
// 목차 본문: 이어 읽기 칸 + 전체 지도. 첫 화면·서재 카드·머리줄 서랍에서 같이 쓴다.
function packBody(P) {
  const ready = isReady(P), n = doneCount(P), t = P.items.length, nx = nextItem(P);
  const wk = weekInfo(P);
  const plan = (P.schedule || []).map(s => `<li class="${wk.week >= s.from && wk.week <= s.to ? "on" : ""}"><b>${s.from}~${s.to}주차</b>${esc(s.label)}</li>`).join("");
  const nxPart = P.parts.find(x => x.id === nx.part);
  return `${ready ? `<section class="hero">
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
            const here = CUR_ITEM && CUR_ITEM === P.id + "/" + it.id;
            const r0 = it.ranges[0];
            const sub = ready ? `${esc(short(P, r0.doc))} ${esc(r0.label)} · ${pages(r0)}${it.ranges.length > 1 ? ` 외 ${it.ranges.length - 1}곳` : ""}` : `${esc(it.rangeText || "")}`;
            const stat = here ? `<span class="tst here">지금 여기</span>` : dn ? `<span class="tst ok">✓ ${fmtDate(recs(P.id)[it.id].doneAt)}</span>` : isNext ? `<span class="tst nx">다음</span>` : "";
            const inner = `<span class="tno">${no}</span><span class="ttl">${esc(it.title)}</span><span class="tsub">${sub}</span>${stat}`;
            return ready ? `<a class="tile ${dn ? "done" : ""} ${isNext ? "next" : ""} ${here ? "cur" : ""}" href="#/p/${P.id}/read/${it.id}">${inner}</a>` : `<div class="tile off">${inner}</div>`;
          }).join("")}</div></div>`;
      }).join("")}
    </section>`;
}
function packHome(P) {
  const n = doneCount(P), t = P.items.length;
  const cat = CATS.find(c => c.id === P.category) || {};
  const fin = FLASH && FLASH.pack === P.id && !FLASH.to ? FLASH : null; FLASH = null;
  $("#app").innerHTML = `<div class="view">
    ${fin ? `<div class="flash" role="status">✓ ‘<b>${esc(fin.title)}</b>’까지 다 읽었어. ${n === t ? "이 기준서를 끝까지 읽었어!" : "아직 안 읽은 항목이 지도에 남아 있어."}</div>` : ""}
    <p class="crumb"><a href="#/">서재</a> › ${esc(cat.label || "")}</p>
    <div class="phead">${badge(P, "lg")}<div><h1 class="ptitle">${esc(P.name)}</h1>
      <p class="pmeta">${esc(P.edition)} · ${esc(P.issuer)} · 원문 ${Object.values(P.docs).map(d => `<a href="${esc(d.url)}" target="_blank" rel="noopener">${esc(d.short)} ↗</a>`).join(" ")}</p></div></div>
    ${packBody(P)}</div>`;
}

// ── 머리줄 '목차' 서랍: 어느 화면에서나 지금 읽는 확장팩의 목차를 연다 ──
let CUR_ITEM = null; // 지금 읽고 있는 항목 (서랍에서 '지금 여기' 표시)
function drawerPack() {
  const seg = (location.hash || "#/").slice(2).split("/");
  return seg[0] === "p" ? PACKS[seg[1]] : null;
}
function drawerList(P) {
  const ready = isReady(P), n = doneCount(P), t = P.items.length, nx = nextItem(P);
  return `<div class="dprog"><div class="bar2"><i style="width:${n / t * 100}%"></i></div><span><b>${n}</b> / ${t} 다 읽음</span></div>
    ${P.parts.map(part => {
      const its = P.items.filter(i => i.part === part.id), d = its.filter(i => isDone(P.id, i.id)).length;
      return `<div class="dpart"><div class="apart-h"><b>${esc(part.label)}</b><span>${ready ? `${d} / ${its.length}` : `${its.length}개`}</span></div>
        <ol class="dlist">${its.map(it => {
          const no = P.items.indexOf(it) + 1, dn = isDone(P.id, it.id), here = CUR_ITEM === P.id + "/" + it.id, isNext = ready && !dn && it.id === nx.id;
          const pg = ready ? pages(it.ranges[0]) : esc(it.rangeText || "");
          const inner = `<span class="dm">${dn ? "✓" : here ? "●" : ""}</span><span class="dno">${no}</span><span class="dt">${esc(it.title)}</span>${here ? `<span class="tst here">지금 여기</span>` : isNext ? `<span class="tst nx">다음</span>` : `<span class="dpg">${pg}</span>`}`;
          return `<li>${ready ? `<a class="drow ${dn ? "done" : ""} ${here ? "here" : ""}" href="#/p/${P.id}/read/${it.id}">${inner}</a>` : `<div class="drow off">${inner}</div>`}</li>`;
        }).join("")}</ol></div>`;
    }).join("")}`;
}
function openDrawer() {
  const P = drawerPack(); if (!P) return;
  closeDrawer(true);
  const d = document.createElement("div"); d.id = "drawer"; d.className = "drawer-wrap";
  d.innerHTML = `<div class="drawer-bg" data-close></div>
    <aside class="drawer" role="dialog" aria-modal="true" aria-label="${esc(P.code)} 목차">
      <div class="dh">${badge(P)}<b>${esc(P.name)}</b><button class="dx" type="button" data-close aria-label="닫기">✕</button></div>
      <div class="dbody">${drawerList(P)}</div>
      <div class="dfoot"><a class="linkbtn" href="#/p/${P.id}">목차 화면으로 →</a></div>
    </aside>`;
  document.body.appendChild(d); document.body.classList.add("noscroll");
  d.querySelectorAll("[data-close]").forEach(x => x.onclick = () => closeDrawer());
  d.querySelectorAll("a[href^='#/']").forEach(a => a.addEventListener("click", () => closeDrawer()));
  requestAnimationFrame(() => {
    d.classList.add("on");
    const h = d.querySelector(".drow.here") || d.querySelector(".drow:not(.done)");
    if (h) d.querySelector(".dbody").scrollTop = h.offsetTop - d.querySelector(".dbody").offsetTop - 200;
  });
  d.querySelector(".dx").focus();
  $("#tocBtn").setAttribute("aria-expanded", "true");
}
function closeDrawer(now) {
  const d = $("#drawer"); if (!d) return;
  document.body.classList.remove("noscroll"); $("#tocBtn").setAttribute("aria-expanded", "false");
  if (now) { d.remove(); return; }
  d.classList.remove("on"); setTimeout(() => d.remove(), 220);
}
addEventListener("keydown", e => { if (e.key === "Escape") closeDrawer(); });

// ── 오늘의 읽기 (#/p/<id>/read/<item>) ──
// 1 지도 → 2 원문(다 읽었어요) → 3 내 정리·구조도 → 4 상황 문제 → 다음 항목. 완료 조건은 2단계까지(정의서 8번).
const STEP_NAMES = ["지도", "원문", "내 정리", "상황 문제"];
let VIEW = { key: null, step: 1, part: 0 };
let SIDE_HIDDEN = false;
let PEEK = false;  // 3·4단계에서 원문 다시 보기
let FLASH = null;  // 방금 '다 읽었어요'를 누른 항목 (알림)

function read(P, id, step) {
  const idx = P.items.findIndex(i => i.id === id);
  if (idx < 0) { location.hash = `#/p/${P.id}`; return; }
  const key = P.id + "/" + id; CUR_ITEM = key;
  if (VIEW.key !== key) { VIEW = { key, step: 1, part: 0 }; PEEK = false; }
  if (step) VIEW.step = Math.min(Math.max(1, step), 4);
  const it = P.items[idx], r = recs(P.id)[id];
  const part = P.parts.find(x => x.id === it.part);
  const nextIt = P.items[idx + 1];
  const flash = FLASH && FLASH.pack === P.id && FLASH.at === key ? FLASH : null; FLASH = null;
  const goNext = nextIt ? `#/p/${P.id}/read/${nextIt.id}` : `#/p/${P.id}`;
  const foot = {
    1: `<button class="btn main" id="fwd" type="button">원문 읽으러 가기 →</button>`,
    2: r && r.done ? `<button class="btn main" id="fwd" type="button">내 정리로 →</button>` : `<button class="btn main" id="doneBtn" type="button">다 읽었어요 →</button>`,
    3: `<button class="btn main" id="fwd" type="button">상황 문제로 →</button>`,
    4: `<a class="btn main" href="${goNext}">${nextIt ? `다음 항목으로 → ${esc(nextIt.title)}` : "목차로 돌아가기"}</a>`,
  }[VIEW.step];
  const mid = {
    1: "", 2: r && r.done ? `<button class="linkbtn" id="undo" type="button">읽음 취소</button>` : "다 읽으면 체크하고 내 정리로 넘어가.",
    3: `<span class="saved" id="saved"></span> · <a class="linkbtn" href="${goNext}">정리 건너뛰고 다음 항목</a>`,
    4: `<span class="saved" id="saved"></span>`,
  }[VIEW.step];
  $("#app").innerHTML = `<div class="view">
    ${flash ? `<div class="flash" role="status">✓ ‘<b>${esc(it.title)}</b>’ 다 읽음으로 표시했어. 남길 게 있으면 정리하고, 없으면 건너뛰어도 돼. <button class="linkbtn" id="flashUndo" type="button">되돌리기</button></div>` : ""}
    <div class="rhead">
      <div><p class="crumb">${badge(P)} ${esc(part.label)} · ${idx + 1} / ${P.items.length}</p>
        <h1 class="rtitle">${esc(it.title)}${r && r.done ? `<span class="done-tag">✓ ${fmtDate(r.doneAt)} 다 읽음</span>` : ""}</h1></div>
      <ol class="steps" aria-label="단계">${STEP_NAMES.map((s, i) => {
        const n = i + 1, cls = n === VIEW.step ? "on" : n < VIEW.step ? "past" : "";
        return `<li class="${cls}"><button type="button" data-step="${n}" ${n === VIEW.step ? 'aria-current="step"' : ""}><b>${n}</b>${s}</button></li>`;
      }).join("")}</ol>
    </div>
    <section class="panel" id="stage"></section>
    <div class="foot">
      <button class="btn" id="prev" type="button" ${VIEW.step === 1 ? "disabled" : ""}>← 이전</button>
      <span class="mid">${mid}</span>
      ${foot}
    </div></div>`;
  $("main").classList.toggle("wide", VIEW.step >= 2);
  ({ 1: stageMap, 2: stagePdf, 3: stageWrite, 4: stageCases })[VIEW.step](P, it);
  const tr = $("#trackBtn"); if (tr) tr.onclick = openDrawer;
  document.querySelectorAll("[data-step]").forEach(b => b.onclick = () => read(P, id, +b.dataset.step));
  $("#prev").onclick = () => read(P, id, VIEW.step - 1);
  const fw = $("#fwd"); if (fw) fw.onclick = () => read(P, id, VIEW.step + 1);
  const db = $("#doneBtn"); if (db) db.onclick = () => {
    const x = rec(P.id, id); x.done = true; x.doneAt = new Date().toISOString();
    if (!S.packs[P.id].startedAt) S.packs[P.id].startedAt = x.doneAt;
    pubBar();
    save(); FLASH = { pack: P.id, at: key }; read(P, id, 3);
  };
  const un = $("#undo"); if (un) un.onclick = () => { const x = rec(P.id, id); x.done = false; x.doneAt = null; save(); read(P, id); };
  const fu = $("#flashUndo"); if (fu) fu.onclick = () => { const x = rec(P.id, id); x.done = false; x.doneAt = null; save(); read(P, id, 2); };
}

// 입력 자동 저장 (0.4초 뒤)
let SAVE_T = null;
function autosave() {
  clearTimeout(SAVE_T);
  const el = $("#saved"); if (el) el.textContent = "저장 중…";
  SAVE_T = setTimeout(() => { save(); const e = $("#saved"); if (e) e.textContent = `저장됨 ${new Date().toTimeString().slice(0, 5)}`; }, 400);
}

// 3·4단계 공통: 왼쪽 작업, 오른쪽 원문 다시 보기
function workLayout(P, it, inner, again) {
  const parts = it.ranges;
  const cur = parts[VIEW.part] || parts[0];
  $("#stage").innerHTML = `<div class="work ${PEEK ? "peek" : ""}">
    <div class="work-main">${inner}</div>
    ${PEEK ? `<div class="peekpane"><div class="pdftop"><span class="pt">원문 · ${esc(short(P, cur.doc))} ${esc(cur.label)}</span>
      <select id="peekPart" aria-label="읽을 곳">${parts.map((p, i) => `<option value="${i}" ${i === VIEW.part ? "selected" : ""}>${esc(short(P, p.doc))} ${esc(p.label)} · ${pages(p)}</option>`).join("")}</select>
      <button class="fold" id="peekClose" type="button">닫기</button></div><div class="pages" id="pages"></div></div>` : ""}
  </div>`;
  const tb = document.createElement("button"); tb.type = "button"; tb.className = "peekbtn"; tb.id = "peekBtn";
  tb.textContent = PEEK ? "원문 닫기" : "원문 다시 보기"; $(".work-main").prepend(tb);
  tb.onclick = () => { PEEK = !PEEK; again(); };
  if (PEEK) {
    $("#peekClose").onclick = () => { PEEK = false; again(); };
    $("#peekPart").onchange = e => { VIEW.part = +e.target.value; again(); };
    checkPdf(P, cur.doc).then(ok => ok ? renderPages(P, it, cur, again) : ($("#pages").innerHTML = `<p class="gempty">원문 PDF가 아직 없어.</p>`));
  }
}

// ── 3단계: 내 정리 + 들여쓰기 구조도 ──
function pubReadonly(P, it, again) {
  workLayout(P, it, `<div class="pubro"><p>지금은 <b>김수현의 공개 기록</b>을 보고 있어서 쓸 수 없어.</p>
    ${noteCard(P, it)}<button class="btn main" id="startOwn" type="button">내 기록으로 쓰기 시작</button></div>`, again);
  $("#startOwn").onclick = () => { PUBMODE = false; pubBar(); again(); };
}
function stageWrite(P, it) {
  if (PUBMODE) return pubReadonly(P, it, () => stageWrite(P, it));
  const x = rec(P.id, it.id);
  workLayout(P, it, `
    <div class="wgrid">
      <label class="wbox"><span class="wl">내 정리 <small>길어도 괜찮아. 내 말로.</small></span>
        <textarea id="note" rows="14" placeholder="이 항목이 무엇을 정하는지, 왜 그렇게 정했는지, 실무에서 어디에 쓰일지 내 말로 써 봐.">${esc(x.note)}</textarea></label>
      <div class="wbox"><span class="wl">구조도 <small>스페이스 두 칸이 한 단계</small></span>
        <div class="treebox"><textarea id="tree" rows="14" spellcheck="false" placeholder="${esc(treeHint(it))}">${esc(x.tree)}</textarea>
        <div class="treeview" id="treeview" aria-label="구조도 그림"></div></div></div>
    </div>`, () => stageWrite(P, it));
  const draw = () => { $("#treeview").innerHTML = drawTree(rec(P.id, it.id).tree) || `<p class="tempty">왼쪽 칸에 들여쓰기로 쓰면 여기 그림이 생겨.</p>`; };
  $("#note").oninput = e => { rec(P.id, it.id).note = e.target.value; autosave(); };
  const t = $("#tree");
  t.oninput = e => { rec(P.id, it.id).tree = e.target.value; autosave(); draw(); };
  t.onkeydown = e => { // Tab = 스페이스 두 칸
    if (e.key !== "Tab") return; e.preventDefault();
    const s = t.selectionStart, v = t.value;
    if (e.shiftKey) { const ls = v.lastIndexOf("\n", s - 1) + 1; if (v.slice(ls, ls + 2) === "  ") { t.value = v.slice(0, ls) + v.slice(ls + 2); t.selectionStart = t.selectionEnd = Math.max(ls, s - 2); } }
    else { t.value = v.slice(0, s) + "  " + v.slice(t.selectionEnd); t.selectionStart = t.selectionEnd = s + 2; }
    t.dispatchEvent(new Event("input"));
  };
  draw();
}
function treeHint(it) { return `${it.title}\n  첫째 갈래\n    세부 내용\n  둘째 갈래`; }

// 들여쓰기 → 나무 (부모보다 두 단계 이상 깊게 쓰면 한 단계로 맞춘다)
function parseTree(txt) {
  const root = { t: "", c: [] }, stack = [{ n: root, d: -1 }];
  String(txt || "").split("\n").forEach(line => {
    if (!line.trim()) return;
    const sp = line.replace(/\t/g, "  ").match(/^ */)[0].length;
    let d = Math.floor(sp / 2);
    while (stack.length > 1 && stack[stack.length - 1].d >= d) stack.pop();
    d = Math.min(d, stack[stack.length - 1].d + 1);
    const node = { t: line.trim().replace(/^[-*•]\s*/, ""), c: [] };
    stack[stack.length - 1].n.c.push(node); stack.push({ n: node, d });
  });
  return root.c;
}
function drawTree(txt) {
  const nodes = parseTree(txt); if (!nodes.length) return "";
  const li = n => `<li><span>${esc(n.t)}</span>${n.c.length ? `<ul>${n.c.map(li).join("")}</ul>` : ""}</li>`;
  return `<ul class="tree">${nodes.map(li).join("")}</ul>`;
}

// ── 4단계: 상황 문제 ──
function stageCases(P, it) {
  if (PUBMODE) return pubReadonly(P, it, () => stageCases(P, it));
  const x = rec(P.id, it.id);
  if (!x.cases.length) x.cases.push({ q: "", a: "", ref: "" });
  workLayout(P, it, `
    <p class="whelp">다른 AI에게 이 항목으로 상황 문제를 받아서 붙여 넣어. 답은 내가 쓰고, <b>맞는지는 원문 문단을 찾아 내가 확인</b>해. 이 사이트는 채점하지 않아.</p>
    <div class="cases">${x.cases.map((c, i) => `<div class="case" data-i="${i}">
      <div class="case-h"><b>상황 ${i + 1}</b>${x.cases.length > 1 ? `<button class="linkbtn del" type="button" data-del="${i}">지우기</button>` : ""}</div>
      <label><span class="wl">상황</span><textarea data-f="q" rows="3" placeholder="예: A사는 국내 사업장은 배출권거래제 지침으로, 해외 사업장은 GHG 프로토콜로 Scope 1·2를 쟀다. 어떻게 공시해야 하나?">${esc(c.q)}</textarea></label>
      <label><span class="wl">내 답</span><textarea data-f="a" rows="4" placeholder="이 기준서에 따르면 …">${esc(c.a)}</textarea></label>
      <label><span class="wl">근거 문단</span><input data-f="ref" value="${esc(c.ref)}" placeholder="예: 제2호 문단 29⑴㈒, 19쪽"></label>
    </div>`).join("")}</div>
    ${x.cases.length < 5 ? `<button class="btn" id="addCase" type="button">+ 상황 하나 더</button>` : ""}`, () => stageCases(P, it));
  document.querySelectorAll(".case [data-f]").forEach(el => el.oninput = e => {
    const i = +el.closest(".case").dataset.i; rec(P.id, it.id).cases[i][el.dataset.f] = e.target.value; autosave();
  });
  document.querySelectorAll("[data-del]").forEach(b => b.onclick = () => { rec(P.id, it.id).cases.splice(+b.dataset.del, 1); save(); stageCases(P, it); });
  const ad = $("#addCase"); if (ad) ad.onclick = () => { rec(P.id, it.id).cases.push({ q: "", a: "", ref: "" }); save(); stageCases(P, it); };
}

function stageMap(P, it) {
  const total = it.ranges.reduce((a, r) => a + (r.end - r.start + 1), 0);
  $("#stage").innerHTML = `<div class="mapbox">
    <p class="where">${esc(P.code)} 전체에서 여기</p>
    <button class="track" id="trackBtn" type="button" aria-label="${esc(P.code)} 목차 열기">${dotMap(P, it.id).replace('class="dotmap"', 'class="dotmap in"')}<span class="track-go">목록으로 보기 ☰</span></button>
    <p class="mapline">${esc(it.map)}</p>
    <div class="toread"><h3>오늘 읽을 곳</h3>
      ${it.ranges.map(r => `<div class="rrow"><span class="kind ${esc(r.kind)}">${esc(r.kind)}</span>
        <span class="lb">${esc(short(P, r.doc))} ${esc(r.label)}${r.by ? `<small>${esc(r.by)}이 이 부분을 가리킨다</small>` : ""}</span><span class="pg">${pages(r)}</span></div>`).join("")}
    </div>
    <p class="total">모두 약 ${total}쪽</p>
    ${it.refs.length ? `<p class="refs"><b>참고로 열어 볼 곳</b> · ${it.refs.map(r => `${esc(r.label)} (${pages(r)}, ${esc(r.by)})`).join(" · ")} — 다른 항목에서 읽는 부분이라 진도에는 넣지 않았어.</p>` : ""}
  </div>`;
}

// ── 원문 보기: pdf.js로 직접 그린다 (폭에 맞춰 크게, 오늘 범위의 쪽만) ──
let PDFJS = null; const PDFDOCS = {};
let ZOOM = (() => { try { return +localStorage.getItem("reading-zoom") || 1; } catch (e) { return 1; } })();
let EXTRA = { key: null, before: 0, after: 0 };
let GUIDE_OPEN = true;
function loadPdfjs() {
  return PDFJS ||= new Promise((res, rej) => {
    const s = document.createElement("script"); s.src = "vendor/pdfjs/pdf.min.js";
    s.onload = () => { pdfjsLib.GlobalWorkerOptions.workerSrc = "vendor/pdfjs/pdf.worker.min.js"; res(pdfjsLib); };
    s.onerror = rej; document.head.appendChild(s);
  });
}
function getPdf(url) { return PDFDOCS[url] ||= loadPdfjs().then(l => l.getDocument(url).promise); }

async function stagePdf(P, it) {
  const parts = [...it.ranges.map(r => ({ ...r, ref: false })), ...it.refs.map(r => ({ ...r, ref: true }))];
  const cur = parts[VIEW.part] || parts[0];
  const doc = P.docs[cur.doc], gl = doc.glossary;
  const ekey = VIEW.key + "/" + VIEW.part; if (EXTRA.key !== ekey) EXTRA = { key: ekey, before: 0, after: 0 };
  const guide = (it.guide || []).filter(g => g.doc === cur.doc && g.page >= cur.start - EXTRA.before && g.page <= cur.end + EXTRA.after);
  const isEn = doc.lang === "en";
  const ok = await checkPdf(P, cur.doc);
  $("#stage").innerHTML = `<div class="reader ${SIDE_HIDDEN ? "hide-side" : ""} ${isEn && GUIDE_OPEN ? "with-guide" : ""}">
    <div class="side"><h3>읽을 곳</h3>
      ${parts.map((p, i) => p.ref ? "" : `<button class="part ${i === VIEW.part ? "on" : ""}" data-i="${i}" type="button"><span class="lb">${esc(short(P, p.doc))} ${esc(p.label)}</span><span class="pg">${pages(p)}</span></button>`).join("")}
      ${it.refs.length ? `<p class="sm">참고</p>${parts.map((p, i) => p.ref ? `<button class="ref" data-i="${i}" type="button">${esc(p.label)} · ${pages(p)}</button>` : "").join("")}` : ""}
      ${gl ? `<button class="gl" id="gloss" type="button">${esc(doc.short)} 용어 보기 (${pages(gl)})</button>` : ""}
    </div>
    <div class="pdfwrap">
      <div class="pdftop"><button class="fold" id="fold" type="button">${SIDE_HIDDEN ? "목록 펴기 ›" : "‹ 목록 접기"}</button>
        <span class="pt">${esc(doc.short)} ${esc(cur.label)} · ${pages(cur)}</span>
        <span class="zoom" role="group" aria-label="글씨 크기"><button type="button" id="zo" aria-label="작게">−</button><button type="button" id="zf" title="폭에 맞추기">${Math.round(ZOOM * 100)}%</button><button type="button" id="zi" aria-label="크게">+</button></span>
        ${isEn ? `<button class="fold" id="gtog" type="button">${GUIDE_OPEN ? "길잡이 닫기" : "한국어 길잡이 열기"}</button>` : ""}
        <a href="${fileOf(P, cur.doc)}#page=${cur.start}" target="_blank" rel="noopener">새 창 ↗</a></div>
      ${ok ? `<div class="pages" id="pages" tabindex="0" aria-label="원문 쪽"></div>`
           : `<div class="missing"><div><p><b>원문 PDF가 아직 없어.</b></p><p>${esc(fileOf(P, cur.doc))} 자리에 파일을 넣어 줘.</p><p><a href="${esc(doc.url)}" target="_blank" rel="noopener">공식 원문 받기 ↗</a></p></div></div>`}
      <p class="src">출처: ${esc(P.issuer)}, ${esc(P.name)} ${esc(P.edition)} · <a href="${esc(doc.url)}" target="_blank" rel="noopener">공식 원문</a></p>
    </div>
    ${isEn && GUIDE_OPEN ? `<aside class="guide" id="guide"><div class="gh"><b>한국어 길잡이</b><span class="pill">AI 초안${it.guideChecked ? " · 원문 대조함" : " · 대조 전"}</span></div>
      <p class="gnote">원문을 먼저 읽고, 막히는 문단만 열어 봐. 번역이 아니라 길잡이야.</p>
      ${guide.length ? guide.map((g, i) => `<details class="gi" data-page="${g.page}" ${i === 0 ? "open" : ""}><summary><span class="gp">${g.page}쪽</span>${esc(g.label)}</summary>
        ${g.terms && g.terms.length ? `<p class="gt">${g.terms.map(t => `<span><b>${esc(t[0])}</b> ${esc(t[1])}</span>`).join("")}</p>` : ""}<p class="gk">${esc(g.ko)}</p></details>`).join("")
        : `<p class="gempty">이 범위의 길잡이는 아직 없어.</p>`}
    </aside>` : ""}
  </div>`;
  document.querySelectorAll("[data-i]").forEach(b => b.onclick = () => { VIEW.part = +b.dataset.i; stagePdf(P, it); });
  $("#fold").onclick = () => { SIDE_HIDDEN = !SIDE_HIDDEN; stagePdf(P, it); };
  const gt = $("#gtog"); if (gt) gt.onclick = () => { GUIDE_OPEN = !GUIDE_OPEN; stagePdf(P, it); };
  const setZoom = z => { ZOOM = Math.min(2.2, Math.max(0.6, Math.round(z * 100) / 100)); try { localStorage.setItem("reading-zoom", ZOOM); } catch (e) {} stagePdf(P, it); };
  $("#zo").onclick = () => setZoom(ZOOM - 0.15); $("#zi").onclick = () => setZoom(ZOOM + 0.15); $("#zf").onclick = () => setZoom(1);
  const g = $("#gloss"); if (g) g.onclick = () => window.open(`${fileOf(P, cur.doc)}#page=${gl.start}`, "_blank", "noopener");
  if (ok) renderPages(P, it, cur);
}

async function renderPages(P, it, cur, redo = () => stagePdf(P, it)) {
  const box = $("#pages"); if (!box) return;
  let pdf;
  try { pdf = await getPdf(fileOf(P, cur.doc)); }
  catch (e) { box.outerHTML = `<iframe class="pdf" title="원문" src="${fileOf(P, cur.doc)}#page=${cur.start}"></iframe>`; return; }
  if (!document.body.contains(box)) return;
  const from = Math.max(1, cur.start - EXTRA.before), to = Math.min(pdf.numPages, cur.end + EXTRA.after);
  const first = await pdf.getPage(from), v1 = first.getViewport({ scale: 1 });
  const width = Math.max(280, box.clientWidth - 40) * ZOOM;
  const list = []; for (let n = from; n <= to; n++) list.push(n);
  box.innerHTML = `${from > 1 ? `<button class="more-pg" id="pgb" type="button">↑ 앞 쪽(${from - 1}쪽)도 보기</button>` : ""}
    ${list.map(n => `<figure class="sheet ${n >= cur.start && n <= cur.end ? "" : "outside"}" data-page="${n}" style="width:${width}px;aspect-ratio:${v1.width}/${v1.height}"><canvas></canvas><figcaption>${n}쪽${n >= cur.start && n <= cur.end ? "" : " · 범위 밖"}</figcaption></figure>`).join("")}
    ${to < pdf.numPages ? `<button class="more-pg" id="pga" type="button">↓ 다음 쪽(${to + 1}쪽)도 보기</button>` : ""}`;
  const pb = $("#pgb"); if (pb) pb.onclick = () => { EXTRA.before++; redo(); };
  const pa = $("#pga"); if (pa) pa.onclick = () => { EXTRA.after++; redo(); };
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const draw = async fig => {
    if (fig.dataset.done) return; fig.dataset.done = 1;
    const page = await pdf.getPage(+fig.dataset.page), base = page.getViewport({ scale: 1 });
    const vp = page.getViewport({ scale: width / base.width * dpr });
    const c = fig.querySelector("canvas"); c.width = vp.width; c.height = vp.height;
    await page.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
  };
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) draw(e.target); }), { root: box, rootMargin: "600px 0px" });
  box.querySelectorAll(".sheet").forEach(f => io.observe(f));
  // 길잡이: 지금 보이는 쪽의 문단을 표시하고, 누르면 그 쪽으로
  const gs = [...document.querySelectorAll(".gi")];
  if (gs.length) {
    const seen = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) gs.forEach(g => g.classList.toggle("here", g.dataset.page === e.target.dataset.page)); }), { root: box, threshold: 0.5 });
    box.querySelectorAll(".sheet").forEach(f => seen.observe(f));
    gs.forEach(g => g.querySelector("summary").addEventListener("click", () => { const f = box.querySelector(`.sheet[data-page="${g.dataset.page}"]`); if (f) box.scrollTo({ top: f.offsetTop - box.offsetTop - 12, behavior: "smooth" }); }));
  }
}

// ── 내 기록 (#/notes): 확장팩별로 모아 보기 + 파일 백업 ──
const hasCase = c => c && (c.q || c.a || c.ref);
const hasRec = r => r && (r.done || (r.note || "").trim() || (r.tree || "").trim() || (r.cases || []).some(hasCase));
let NOTE_FILTER = "rec"; // rec: 기록 있는 것만, all: 전부
let IMPORT = null;       // 불러오기 확인 대기 중인 데이터

function notes() {
  const ready = ORDER.map(id => PACKS[id]).filter(isReady);
  const last = S.lastBackup ? fmtDate(S.lastBackup) : null;
  const count = ready.reduce((a, P) => a + P.items.filter(i => hasRec(recs(P.id)[i.id])).length, 0);
  $("#app").innerHTML = `<div class="view">
    ${PUBMODE ? `<p class="eyebrow">공개 기록 · ${PUB.updated ? fmtDate(PUB.updated) + " 기준" : ""}</p><h1 class="h1 sm">${esc(PUB.owner || "")}이 읽고 남긴 것</h1>
    <p class="lead">원문을 읽고 남긴 진도와 기록이야. 쉬운 설명이나 해설이 아니라, 읽은 사람이 직접 쓴 정리와 구조도만 담았어.</p>`
    : `<p class="eyebrow">내 기록</p><h1 class="h1 sm">읽고 남긴 것</h1>
    <section class="backup pubexp">
      <div><b>공개용 기록</b><p>방문자(채용 담당자)에게 보여 줄 기록을 골라 파일로 받아. 받은 파일을 저장소의 <code>reading/log/public.json</code>으로 올리면 사이트에 공개돼.</p>
        <p class="checks"><label><input type="checkbox" checked disabled> 진도와 읽은 날짜</label><label><input type="checkbox" id="pubNote" ${PUBOPT.note ? "checked" : ""}> 내 정리</label><label><input type="checkbox" id="pubTree" ${PUBOPT.tree ? "checked" : ""}> 구조도</label></p>
        ${PUB ? `<p class="last">지금 공개된 기록: ${PUB.updated ? fmtDate(PUB.updated) : "날짜 없음"} 기준</p>` : ""}</div>
      <div class="bk-act"><button class="btn main" id="pubExp" type="button">공개용 파일 받기</button>${PUB ? `<button class="btn" id="pubPrev" type="button">방문자 화면 미리 보기</button>` : ""}</div>
    </section>`}
    ${PUBMODE ? "" : `<section class="backup">
      <div><b>백업</b><p>기록은 이 브라우저에만 저장돼. 브라우저 기록을 지우면 사라지니까 가끔 파일로 받아 둬.</p>
        <p class="last ${last ? "" : "warn"}">${last ? `마지막 백업 ${last}` : "아직 백업한 적 없어"}</p></div>
      <div class="bk-act"><button class="btn main" id="exp" type="button">파일로 내보내기</button>
        <label class="btn" for="imp">파일 불러오기</label><input type="file" id="imp" accept="application/json,.json" hidden></div>
      <div id="impmsg" class="impmsg" role="status"></div>
    </section>`}
    <div class="nf"><span>${count}개 항목에 기록이 있어</span>
      <div class="seg" role="group" aria-label="보기"><button type="button" data-f="rec" class="${NOTE_FILTER === "rec" ? "on" : ""}">기록 있는 것만</button><button type="button" data-f="all" class="${NOTE_FILTER === "all" ? "on" : ""}">전부</button></div></div>
    ${ready.map(P => {
      const its = P.items.filter(i => NOTE_FILTER === "all" || hasRec(recs(P.id)[i.id]));
      return `<section class="nsec"><div class="cat-h">${badge(P)}<h2>${esc(P.name)}</h2><p>${doneCount(P)} / ${P.items.length} 다 읽음</p></div>
        ${its.length ? its.map(it => noteCard(P, it)).join("") : `<p class="gempty">아직 남긴 기록이 없어. 읽고 나서 정리하면 여기 모여.</p>`}</section>`;
    }).join("")}
  </div>`;
  document.querySelectorAll(".seg [data-f]").forEach(b => b.onclick = () => { NOTE_FILTER = b.dataset.f; notes(); });
  if (PUBMODE) return;
  $("#exp").onclick = exportBackup;
  $("#pubNote").onchange = e => { PUBOPT.note = e.target.checked; };
  $("#pubTree").onchange = e => { PUBOPT.tree = e.target.checked; };
  $("#pubExp").onclick = exportPublic;
  const pv = $("#pubPrev"); if (pv) pv.onclick = () => { PUBMODE = true; pubBar(); location.hash = "#/"; };
  $("#imp").onchange = e => { const f = e.target.files[0]; if (f) readImport(f); e.target.value = ""; };
  if (IMPORT) showImport();
}
function noteCard(P, it) {
  const r = recs(P.id)[it.id] || {}, cs = (r.cases || []).filter(hasCase);
  const no = P.items.indexOf(it) + 1;
  return `<article class="ncard ${hasRec(r) ? "" : "empty"}">
    <div class="nh"><span class="tno">${no}</span><h3><a href="#/p/${P.id}/read/${it.id}">${esc(it.title)}</a></h3>${r.done ? `<span class="tst ok">✓ ${fmtDate(r.doneAt)}</span>` : `<span class="tst">안 읽음</span>`}</div>
    ${(r.note || "").trim() ? `<div class="nnote">${esc(r.note.trim())}</div>` : ""}
    ${(r.tree || "").trim() ? `<div class="ncmp"><div><span class="wl">처음 지도</span><p>${esc(it.map)}</p></div><div><span class="wl">내가 그린 구조도</span>${drawTree(r.tree)}</div></div>` : ""}
    ${cs.length ? `<div class="ncases">${cs.map((c, i) => `<div class="nc"><p class="ncq"><b>상황 ${i + 1}</b> ${esc(c.q)}</p>${c.a ? `<p class="nca">${esc(c.a)}</p>` : ""}${c.ref ? `<p class="ncr">근거 ${esc(c.ref)}</p>` : ""}</div>`).join("")}</div>` : ""}
  </article>`;
}

let PUBOPT = { note: true, tree: true };
function exportPublic() {
  const out = { owner: "김수현", updated: new Date().toISOString(), packs: {} };
  for (const [pid, pk] of Object.entries(S.packs)) {
    const items = {};
    for (const [id, r] of Object.entries(pk.items || {})) {
      if (!r) continue;
      const x = { done: !!r.done, doneAt: r.done ? r.doneAt : null };
      if (PUBOPT.note && (r.note || "").trim()) x.note = r.note;
      if (PUBOPT.tree && (r.tree || "").trim()) x.tree = r.tree;
      if (x.done || x.note || x.tree) items[id] = x;
    }
    if (Object.keys(items).length) out.packs[pid] = { items, ...(pk.startedAt ? { startedAt: pk.startedAt } : {}) };
  }
  const blob = new Blob([JSON.stringify(out, null, 1)], { type: "application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "public.json";
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
// 공개 기록을 보는 중이면 머리줄 아래 띠로 알린다
function pubBar() {
  let b = $("#pubbar");
  if (!PUBMODE || !PUB) { if (b) b.remove(); return; }
  if (!b) { b = document.createElement("div"); b.id = "pubbar"; b.className = "pubbar"; $(".bar").after(b); }
  const own = hasOwn();
  b.innerHTML = `<span><b>${esc(PUB.owner || "")}의 공개 기록</b>을 보고 있어${PUB.updated ? ` · ${fmtDate(PUB.updated)} 기준` : ""}. ${own ? "" : "직접 읽기 시작하면 네 기록이 이 브라우저에 따로 쌓여."}</span>${own ? `<button class="linkbtn" id="pubOff" type="button">내 기록으로 돌아가기</button>` : ""}`;
  const off = $("#pubOff"); if (off) off.onclick = () => { PUBMODE = false; pubBar(); route(); };
}

function exportBackup() {
  S.lastBackup = new Date().toISOString(); save();
  const blob = new Blob([JSON.stringify({ app: "원문 읽기", ...S }, null, 1)], { type: "application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = `원문읽기-백업-${S.lastBackup.slice(0, 10)}.json`; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  notes();
}
// 불러오기: 형식을 검사하고, 모르는 확장팩·항목은 버린다. 문제가 있으면 기존 기록을 건드리지 않는다.
function cleanImport(o) {
  if (!o || typeof o !== "object" || !o.packs || typeof o.packs !== "object") throw new Error("원문 읽기 백업 파일이 아니야.");
  const out = { version: 1, packs: {} }; let n = 0, dropped = 0;
  const str = v => typeof v === "string" ? v.slice(0, 50000) : "";
  const iso = v => typeof v === "string" && !isNaN(Date.parse(v)) ? v : null;
  for (const [pid, pv] of Object.entries(o.packs)) {
    const P = PACKS[pid]; if (!P || !pv || typeof pv.items !== "object") { dropped++; continue; }
    const ids = new Set(P.items.map(i => i.id)), items = {};
    for (const [id, r] of Object.entries(pv.items || {})) {
      if (!ids.has(id) || !r || typeof r !== "object") { dropped++; continue; }
      items[id] = { done: r.done === true, doneAt: r.done === true ? iso(r.doneAt) || new Date().toISOString() : null, note: str(r.note), tree: str(r.tree),
        cases: Array.isArray(r.cases) ? r.cases.slice(0, 5).map(c => ({ q: str(c && c.q), a: str(c && c.a), ref: str(c && c.ref) })) : [] };
      n++;
    }
    out.packs[pid] = { items }; if (iso(pv.startedAt)) out.packs[pid].startedAt = pv.startedAt;
  }
  if (!n) throw new Error("불러올 기록이 없어.");
  if (iso(o.lastBackup)) out.lastBackup = o.lastBackup;
  return { data: out, n, dropped };
}
function readImport(f) {
  const fr = new FileReader();
  fr.onload = () => {
    try { IMPORT = cleanImport(JSON.parse(fr.result)); IMPORT.name = f.name; showImport(); }
    catch (e) { IMPORT = null; $("#impmsg").innerHTML = `<p class="bad">불러오지 못했어. ${esc(e.message && !/JSON|Unexpected/.test(e.message) ? e.message : "파일 형식이 맞지 않아.")} 지금 기록은 그대로야.</p>`; }
  };
  fr.readAsText(f);
}
function showImport() {
  $("#impmsg").innerHTML = `<p><b>${esc(IMPORT.name)}</b> · 항목 ${IMPORT.n}개${IMPORT.dropped ? ` (알 수 없는 ${IMPORT.dropped}개는 뺐어)` : ""}. 지금 기록을 이 파일 내용으로 바꿀까?</p>
    <div class="bk-act"><button class="btn main" id="impOk" type="button">바꾸기</button><button class="btn" id="impNo" type="button">그만두기</button></div>`;
  $("#impOk").onclick = () => { S = IMPORT.data; IMPORT = null; save(); notes(); $("#impmsg").innerHTML = `<p class="good">불러왔어.</p>`; };
  $("#impNo").onclick = () => { IMPORT = null; notes(); };
}

// ── 용어집 (#/terms): 네 분야로 나눈 용어, 원문 정의가 있으면 그 쪽을 바로 연다 ──
let GLOSS = null, TQ = "", TCAT = "all", TOFF = false;
async function loadGloss() { return GLOSS ||= (await (await fetch("glossary.json")).json()); }
async function termsView() {
  const G = await loadGloss();
  const norm = s => String(s || "").toLowerCase().replace(/\s+/g, "").replace(/스코프/g, "scope");
  const q = norm(TQ);
  const list = G.terms.filter(t => (TCAT === "all" || t.cats.includes(TCAT)) && (!TOFF || t.official) && (!q || norm(t.t + t.en + t.d).includes(q)))
    .sort((a, b) => { const s = t => !q ? 0 : norm(t.t).startsWith(q) ? 2 : norm(t.t).includes(q) ? 1 : 0; const g = t => /^[가-힣]/.test(t.t) ? 0 : /^[A-Za-z]/.test(t.t) ? 1 : 2; return (s(b) - s(a)) || (g(a) - g(b)) || a.t.localeCompare(b.t, "ko"); });
  const cnt = c => G.terms.filter(t => c === "all" || t.cats.includes(c)).length;
  const catName = id => (CATS.find(c => c.id === id) || {}).label || id;
  $("#app").innerHTML = `<div class="view">
    <p class="eyebrow">용어집</p><h1 class="h1 sm">기준서에 나오는 말</h1>
    <p class="lead">네 분야로 나눈 전문용어 ${G.terms.length}개. <b>원문 정의</b>가 붙은 용어는 기준서의 공식 정의 쪽을 바로 열 수 있어.</p>
    <div class="tbar">
      <input class="tsearch" id="tq" type="search" placeholder="용어 검색 (예: 스코프 3, 중대성, CDP)" value="${esc(TQ)}" aria-label="용어 검색">
      <label class="tonly"><input type="checkbox" id="toff" ${TOFF ? "checked" : ""}> 원문 정의 있는 것만</label>
    </div>
    <div class="tcats" role="group" aria-label="분야">${[["all", "전체"], ...CATS.map(c => [c.id, c.label])].map(([id, l]) => `<button type="button" data-c="${id}" class="${TCAT === id ? "on" : ""}">${esc(l)} <span>${cnt(id)}</span></button>`).join("")}</div>
    <p class="tcount">${list.length}개${q ? ` · '${esc(TQ)}' 검색` : ""}</p>
    <div class="tlist">${list.slice(0, 600).map(t => `<article class="term ${t.official ? "off" : ""}">
      <div class="term-h"><h3>${esc(t.t)}</h3>${t.en ? `<span class="ten">${esc(t.en)}</span>` : ""}</div>
      <p class="td">${esc(t.d)}</p>
      <div class="tf">${t.cats.map(c => `<span class="tcat">${esc(catName(c))}</span>`).join("")}
        ${t.official ? `<button class="tofb" type="button" data-pack="${t.official.pack}" data-doc="${t.official.doc}" data-page="${t.official.page}" data-t="${esc(t.t)}">원문 정의 · ${esc(t.official.label)}</button>` : ""}
        ${t.item && PACKS[t.item.pack] && PACKS[t.item.pack].items.find(i => i.id === t.item.id) ? `<a class="titem" href="#/p/${t.item.pack}/read/${t.item.id}">나오는 곳: ${esc(PACKS[t.item.pack].items.find(i => i.id === t.item.id).title)}</a>` : `<span class="tfrom">${esc(t.from)}</span>`}
      </div></article>`).join("")}</div>
    ${list.length > 600 ? `<p class="tcount">검색어를 넣으면 나머지 ${list.length - 600}개도 찾을 수 있어.</p>` : ""}
    <p class="tnote">${esc(G.note)}</p>
  </div>`;
  const qi = $("#tq"); let tm;
  qi.oninput = e => { clearTimeout(tm); tm = setTimeout(() => { TQ = e.target.value; termsView().then(() => { const n = $("#tq"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }); }, 180); };
  document.querySelectorAll(".tcats [data-c]").forEach(b => b.onclick = () => { TCAT = b.dataset.c; termsView(); });
  $("#toff").onchange = e => { TOFF = e.target.checked; termsView(); };
  document.querySelectorAll(".tofb").forEach(b => b.onclick = () => openPageModal(PACKS[b.dataset.pack], b.dataset.doc, +b.dataset.page, b.dataset.t));
}
// 원문 한 쪽을 크게 띄우는 창
async function openPageModal(P, doc, page, title) {
  const m = document.createElement("div"); m.className = "drawer-wrap pmodal"; m.id = "pmodal";
  m.innerHTML = `<div class="drawer-bg" data-close></div><div class="pm" role="dialog" aria-modal="true" aria-label="${esc(title)} 원문 정의">
    <div class="dh"><b>${esc(title)}</b><span class="pt">${esc(P.docs[doc].short)} ${page}쪽</span><a class="linkbtn" href="${fileOf(P, doc)}#page=${page}" target="_blank" rel="noopener">새 창 ↗</a><button class="dx" type="button" data-close aria-label="닫기">✕</button></div>
    <div class="pm-body"><canvas></canvas></div><p class="src">출처: ${esc(P.issuer)}, ${esc(P.name)} ${esc(P.edition)}</p></div>`;
  document.body.appendChild(m); document.body.classList.add("noscroll");
  const close = () => { m.remove(); document.body.classList.remove("noscroll"); removeEventListener("keydown", esc_); };
  const esc_ = e => { if (e.key === "Escape") close(); };
  addEventListener("keydown", esc_);
  m.querySelectorAll("[data-close]").forEach(x => x.onclick = close);
  requestAnimationFrame(() => m.classList.add("on")); m.querySelector(".dx").focus();
  try {
    const pdf = await getPdf(fileOf(P, doc)), pg = await pdf.getPage(page), base = pg.getViewport({ scale: 1 });
    const box = m.querySelector(".pm-body"), w = Math.min(box.clientWidth - 24, 900), dpr = Math.min(devicePixelRatio || 1, 2);
    const vp = pg.getViewport({ scale: w / base.width * dpr }), c = box.querySelector("canvas");
    c.width = vp.width; c.height = vp.height; c.style.width = w + "px";
    await pg.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
  } catch (e) { m.querySelector(".pm-body").innerHTML = `<p class="gempty">원문을 불러오지 못했어.</p>`; }
}

// ── 길 찾기: #/  #/p/<pack>  #/p/<pack>/read/<item>  #/notes ──
function route() {
  closeDrawer(true); CUR_ITEM = null; $("main").classList.remove("wide");
  const seg = (location.hash || "#/").slice(2).split("/");
  const P = seg[0] === "p" ? PACKS[seg[1]] : null;
  document.querySelectorAll("[data-nav]").forEach(x => x.classList.toggle("on", x.dataset.nav === (seg[0] === "notes" ? "notes" : seg[0] === "terms" ? "terms" : !seg[0] ? "shelf" : "")));
  $("#packnav").innerHTML = P ? `<span class="sep">/</span><span class="catn">${esc((CATS.find(c => c.id === P.category) || {}).label || "")}</span><span class="sep">/</span><a href="#/p/${P.id}">${badge(P, "sm")} ${esc(P.name)}</a>` : "";
  const tb = $("#tocBtn"); tb.hidden = !P; if (P) tb.textContent = `☰ ${P.code} 목차`;
  if (P && seg[2] === "read" && isReady(P)) read(P, seg[3]);
  else if (P) packHome(P);
  else if (seg[0] === "notes") notes();
  else if (seg[0] === "terms") termsView();
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
    try { const r = await fetch("log/public.json", { cache: "no-cache" }); if (r.ok) { PUB = await r.json(); if (!PUB || typeof PUB.packs !== "object") PUB = null; } } catch (e) { PUB = null; }
    PUBMODE = !!PUB && !hasOwn(); pubBar();
    $("#tocBtn").onclick = () => $("#drawer") ? closeDrawer() : openDrawer();
    addEventListener("hashchange", route); route();
  } catch (e) {
    $("#app").innerHTML = `<div class="view temp"><h1>목차를 못 불러왔어</h1><p>파일을 직접 열면(file://) 브라우저가 막아. 폴더에서 <code>python3 -m http.server</code>를 켜고 열어 줘.</p></div>`;
  }
})();
