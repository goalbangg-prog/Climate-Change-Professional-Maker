import json,re,html,sys
sys.path.insert(0,'.')
import importlib.util as u;sp=u.spec_from_file_location('d',__import__('os').path.join(__import__('os').path.dirname(__file__),'k2-8-c.data.py'));m=u.module_from_spec(sp);sp.loader.exec_module(m);B=m.B
R=__import__('os').path.join(__import__('os').path.dirname(__file__),'..','..')+'/'
e=html.escape
src=open(R+'proto/k2-8-b.html',encoding='utf-8').read()
S=[x for x in json.load(open(R+'data/books/kssb-2.json'))['sessions'] if x['id']=='k2-8'][0]
terms={}
for b in S['blocks']:
    for t in b.get('terms',[]): terms[t['t']]=t
def txt(s,used):
    h=e(s)
    h=h.replace('[[','<mark>').replace(']]','</mark>')
    for k,t in terms.items():
        if k in used: continue
        m=re.search(re.escape(e(k))+r'(?![^<]*>)',h)
        if m:
            used.add(k); h=h[:m.start()]+f'<button type="button" class="term" data-d="{e(t["d"])}" data-en="{e(t.get("en",""))}">{e(k)}</button>'+h[m.end():]
    return h
rf=lambda r: f' <span class="rf">{e(r)}</span>' if r else ''
used=set();out=[];toc=[]
for i,b in enumerate(B):
    segs=[]
    for lab,items in b['segs']:
        cls='seg ex' if lab=='실무에서는' else 'seg'
        body=''
        for it in items:
            k=it[0]
            if k=='p': body+=f'<p>{txt(it[1],used)}{rf(it[2])}</p>'
            elif k=='li': body+='<ul>'+''.join(f'<li>{txt(a,used)}{rf(r)}</li>' for a,r in it[1])+'</ul>'
            elif k=='table': body+=f'<div class="figt"><span class="cap">{e(it[1])}</span><div class="tw"><table class="tbl sm"><thead><tr>{"".join(f"<th>{e(x)}</th>" for x in it[2])}</tr></thead><tbody>{"".join("<tr>"+"".join(f"<td>{e(c)}</td>" for c in r)+"</tr>" for r in it[3])}</tbody></table></div></div>'
            elif k=='ex': body+=f'<p>{txt(it[1],used)}</p>'+(f'<small class="exs">{e(it[2])}</small>' if it[2] else '')
            elif k=='quote': body+=f'<blockquote class="oq"><span class="k">원문 한 줄 · {e(it[2])}</span>{e(it[1])}</blockquote>'
        segs.append(f'<div class="{cls}"><div class="sl">{e(lab)}</div><div class="sb">{body}</div></div>')
    own=f' <span class="bd n">{e(b["own"])}</span>' if b.get('own') else ''
    out.append(f'<section class="blk c" id="b{i}" data-t="{e(b["title"])}"><div class="bh"><span class="bn">{i+1}</span><div><h3>{e(b["title"])}{own}</h3><span class="ref">{e(b["ref"])}</span></div></div><div class="prose2">{"".join(segs)}</div></section>')
    toc.append(f'<a href="#b{i}"><i></i>{e(b["title"])}</a>')
blocks=''.join(out)
# 본문 교체
a=src.index('<section class="sec" id="s-body">'); z=src.index('<!-- 읽은 뒤 -->')
body=f'''<section class="sec" id="s-body">
  <div class="sec-h"><span class="tag">본문</span><h2>기준서 함께 읽기</h2><small>약 {S["min"]}분 · 블록 6개</small></div>
  {blocks}
 </section>

 '''
src=src[:a]+body+src[z:]
# 이 회차 정리: 위에서 빼고 맨 끝 30초 정리로
sa=src.index('<div class="card sumc">'); sb=src.index('</ol></div>',sa)+len('</ol></div>')
summ=src[sa:sb]; src=src[:sa]+src[sb:]
items=summ[summ.index('<ol>'):]
src=src.replace('<div class="done-row" id="doneRow">',f'<section class="sec" id="s-30"><div class="s30"><span class="k">30초 정리</span>{items}</div></section>\n <div class="done-row" id="doneRow">',1)
src=src.replace('<p class="howto">초록 밑줄은 블록마다 가장 중요한 문장이다. 점선 밑줄 용어를 누르면 뜻이 나온다.</p>','<p class="howto">읽는 법: <mark>초록 밑줄</mark>은 블록마다 가장 중요한 문장, 문장 끝 <span class="rf">B25</span> 꼬리표는 근거 문단 번호다. 점선 밑줄 용어는 누르면 뜻이 나온다.</p>')
# 목차
ta=src.index('<div class="toc" id="toc">'); tb=src.index('</div>',ta)
src=src[:ta]+'<div class="toc" id="toc"><a href="#s-guide"><i></i>읽기 전에</a>'+''.join(toc)+'<a href="#s-points"><i></i>읽은 뒤에</a>'+src[tb:]
# 안내줄·제목·저장키
src=src.replace('v6 절충안 · 처음 버전 본문은 그대로 두고, 앞뒤에 길잡이와 새 디자인만 입혔다.','v6 절충안 2 · 정보는 처음 버전과 같고, 문장을 짧게 나누고 머리말·근거 꼬리표를 붙였다.')
src=src.replace('<a href="k2-8.html">요약형 시제품</a> · <a href="../#read/k2-8">처음 버전</a>과 비교해 보자.','<a href="k2-8-b.html">절충안 1</a> · <a href="k2-8.html">요약형</a> · <a href="../#read/k2-8">처음 버전</a>과 비교해 보자.')
src=src.replace('(v6 절충안)</title>','(v6 절충안 2)</title>').replace('const KEY="rc6-k2-8-b";','const KEY="rc6-k2-8-c";')
# 글자 크기 버튼
src=src.replace('<div class="tools"><button class="icon-btn" id="theme"','<div class="tools"><button class="icon-btn fs" id="fsDn" type="button" aria-label="글자 작게">가−</button><button class="icon-btn fs" id="fsUp" type="button" aria-label="글자 크게">가+</button><button class="icon-btn" id="theme"',1)
# 지금 읽는 블록 띠
src=src.replace('<div class="proto-note">','<div class="nowbar" id="nowbar" hidden><span id="nowT"></span><i><b id="nowP"></b></i></div>\n<div class="proto-note">',1)
css='''/* 절충안 2: 머리말 | 내용 두 칸, 짧은 문장, 근거 꼬리표 */
:root{--fs:17px}
.blk.c{padding:26px 28px 18px}
.prose2{font-size:var(--fs);line-height:1.8;color:var(--fg1)}
.seg{display:grid;grid-template-columns:132px minmax(0,34em);gap:18px;padding:14px 0;border-top:1px solid var(--line2)}
.seg:first-child{border-top:0;padding-top:4px}
.sl{font-size:13.5px;font-weight:800;color:var(--g6);padding-top:calc((var(--fs)*1.8 - 13.5px*1.5)/2);line-height:1.5}
.sb{min-width:0}.blk.c,.prose2{min-width:0;max-width:100%}
.sb p+p,.sb p+ul,.sb ul+p{margin-top:8px}
.sb ul{margin:0;padding-left:0;list-style:none;display:flex;flex-direction:column;gap:6px}
.sb li{position:relative;padding-left:16px}
.sb li::before{content:"";position:absolute;left:2px;top:calc(var(--fs)*.8);width:6px;height:6px;border-radius:50%;background:var(--g5)}
.rf{display:inline-block;font-size:11.5px;font-weight:700;color:var(--fg4);background:var(--muted);border-radius:6px;padding:0 6px;margin-left:4px;line-height:1.7;vertical-align:1px;white-space:nowrap;font-variant-numeric:tabular-nums}
.seg.ex{background:var(--b1);border-radius:12px;border-top:0;margin-top:10px;padding:14px 16px;grid-template-columns:116px minmax(0,1fr)}
.seg.ex .sl{color:var(--b6)}
.exs{display:block;font-size:12px;color:var(--fg3);margin-top:4px}
.prose2 mark{background:linear-gradient(transparent 58%,var(--g3) 58%);font-weight:650}
.howto mark{background:linear-gradient(transparent 58%,var(--g3) 58%);font-weight:600}
.oq{margin-top:10px}
.figt{margin-top:2px}
.bh h3 .bd{vertical-align:3px;margin-left:6px}
.fs{font-size:12px;font-weight:800;width:auto;padding:0 9px;border-radius:999px}
.nowbar{position:sticky;top:58px;z-index:25;background:color-mix(in srgb,var(--card) 94%,transparent);backdrop-filter:blur(6px);border-bottom:1px solid var(--line);font-size:13px;font-weight:700;padding:7px 20px 9px;display:flex;flex-direction:column;gap:5px}
.nowbar span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nowbar i{display:block;height:3px;border-radius:2px;background:var(--line)}.nowbar b{display:block;height:100%;width:0;background:var(--g6);border-radius:2px;transition:width .2s}
@media (min-width:1001px){.nowbar{display:none!important}}
@media (max-width:760px){
  .seg{grid-template-columns:minmax(0,1fr);gap:2px;padding:12px 0}.sl{padding-top:0}
  .seg.ex{grid-template-columns:minmax(0,1fr)}
  .prose2{font-size:calc(var(--fs) - 0.5px)}
  .blk.c{padding:20px 18px 12px}
  .fs{display:none}
}
'''
src=src.replace('@media (prefers-reduced-motion:reduce)',css+'@media (prefers-reduced-motion:reduce)',1)
js='''
  /* 글자 크기 */
  let fs=+(localStorage.getItem("rc6-fs")||17);const setFs=v=>{fs=Math.max(15,Math.min(21,v));document.documentElement.style.setProperty("--fs",fs+"px");try{localStorage.setItem("rc6-fs",fs)}catch(e){}};setFs(fs);
  $("#fsDn").onclick=()=>setFs(fs-1);$("#fsUp").onclick=()=>setFs(fs+1);
  /* 지금 읽는 블록 띠 (폰) */
  const blks=[...document.querySelectorAll(".blk.c")];const nb=$("#nowbar");
  function now(){const y=innerHeight*.3;let cur=-1;blks.forEach((b,i)=>{if(b.getBoundingClientRect().top<y)cur=i});
    const last=blks[blks.length-1].getBoundingClientRect().bottom<y;nb.hidden=cur<0||last;if(cur<0)return;
    $("#nowT").textContent=`${cur+1}/${blks.length} · ${blks[cur].dataset.t}`;const r=blks[cur].getBoundingClientRect();$("#nowP").style.width=Math.min(100,Math.max(0,(y-r.top)/r.height*100))+"%"}
  addEventListener("scroll",now,{passive:true});now();
'''
src=src.replace('  /* 테마 */',js+'  /* 테마 */',1)
open(R+'proto/k2-8-c.html','w',encoding='utf-8').write(src)
print('ok',len(src))
