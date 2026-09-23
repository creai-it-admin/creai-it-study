// Run from the app root: node docs/education/ot/build.cjs
// JSX is precompiled for offline use; components.js remains the shared visual system.
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const dir=__dirname;
const read=name=>fs.readFileSync(path.join(dir,name),'utf8');
const compile=name=>ts.transpileModule(read(name),{compilerOptions:{jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2020}}).outputText;
const system=compile('src/components.jsx'),slides=compile('src/slides.jsx');
fs.writeFileSync(path.join(dir,'components.js'),system);
fs.writeFileSync(path.join(dir,'slides.js'),slides);
const tokenScript=`const vars={...window.C,...window.TYPE_SCALE,edge:window.SPACING.edge,top:window.SPACING.top,exhibitTop:window.SPACING.body};for(const [k,v] of Object.entries(vars))document.documentElement.style.setProperty('--'+k,typeof v==='number'?v+'px':v);`;
const chrome=`<footer class="viewerbar"><span id="current" class="current"></span><span class="shortcuts">← → 이동 · G 목차 · N 노트 · F 전체화면</span><div class="buttons"><button id="tocButton" aria-label="목차 열기">목차</button><button id="notesButton" aria-label="발표 노트 열기">노트</button><button id="fullButton" aria-label="전체화면">전체화면</button><button id="previous" aria-label="이전 슬라이드">←</button><span id="counter" class="counter" aria-live="polite"></span><button id="next" aria-label="다음 슬라이드">→</button></div></footer><dialog id="toc" aria-labelledby="tocTitle"><button class="close" aria-label="목차 닫기">×</button><h2 id="tocTitle">Foundation OT</h2><div class="toclist" id="toclist"></div></dialog><dialog id="notes" aria-labelledby="notesTitle"><button class="close" aria-label="발표 노트 닫기">×</button><h2 id="notesTitle"></h2><p id="notesText"></p></dialog>`;
const safe=s=>s.replace(/<\/script/gi,'<\\/script');
function html(single=0){
 const css=single?read('theme.css'):read('theme.css').replace("url('assets/deck-sans.woff2')",`url('data:font/woff2;base64,${fs.readFileSync(path.join(dir,'assets/deck-sans.woff2')).toString('base64')}')`);
 const scripts=single?['assets/react.min.js','assets/react-dom.min.js','cohort.js','components.js','slides.js'].map(src=>`<script src="${src}"></script>`).join(''):['assets/react.min.js','assets/react-dom.min.js','cohort.js'].map(name=>`<script>${safe(read(name))}</script>`).join('')+`<script>${safe(system)}</script><script>${safe(slides)}</script>`;
 return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="CREAI+IT EDU Foundation 교육 공통 OT"><title>CREAI+IT EDU · Foundation OT${single?' · '+single:''}</title><style>${css}</style>${scripts}<script>${tokenScript}</script></head><body${single?` class="single" data-single="${single}"`:''}><main class="viewport" id="viewport" aria-label="OT 슬라이드"><div class="stage" id="stage"><div id="slide-root"></div></div></main>${single?'':chrome}<script>${safe(read('viewer.js'))}</script></body></html>`;
}
for(let i=1;i<=7;i++)fs.writeFileSync(path.join(dir,`slide-${i}.html`),html(i));
fs.writeFileSync(path.join(dir,'index.html'),html());
console.log('Built 7 slides + self-contained index.html');
