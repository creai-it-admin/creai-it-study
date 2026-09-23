const {SlideFrame,SlideTitle,BottomLine,Flow}=window;
const names=['반도체·제조','인프라·클라우드','모델','서비스·업무','고객'];
const txt=s=>s?.split('\n').map((x,i)=><React.Fragment key={i}>{i>0&&<br/>}{x}</React.Fragment>);
function Rail({active}){return <div className="mapRail">{names.map((n,i)=><React.Fragment key={n}>{i>0&&<span>→</span>}<b className={active.includes(i)?'active':''}>{n}</b></React.Fragment>)}</div>}
function Items({s}){return s.items.map(([a,b,c,d],i)=><section key={a}><span className="itemIndex">{String(i+1).padStart(2,'0')}</span><h2>{txt(a)}</h2><p>{txt(b)}</p>{c&&<small>{txt(c)}</small>}{d&&<small className="cost">{txt(d)}</small>}</section>)}
function Exhibit({s}){
 const kind=s.kind;
 if(kind==='layers')return <div className="layers4"><div>{s.items.map(([a,b],i)=><section key={a}><b>{a}</b><span>{b}</span></section>)}</div><aside>{txt(s.side)}</aside></div>;
 if(kind==='flow')return <div><Flow items={s.items}/>{s.under&&<div className="under4">{s.under}</div>}</div>;
 if(kind==='loop')return <div className="loop4"><Flow items={s.items}/><div className="return4">↶ 결과를 다음 입력으로 · 필요한 만큼 반복</div></div>;
 if(kind==='map')return <div className="map4"><div className="mapBoxes">{s.items.map(([a,b],i)=><React.Fragment key={a}>{i>0&&<span>→</span>}<section><b>{a}</b><p>{txt(b)}</p></section></React.Fragment>)}</div><div className="mapSupports"><span>전력 → 인프라</span><span>데이터 → 학습 · 업무 활용</span></div></div>;
 if(kind==='ledger')return <div className="ledger4">{s.items.map(([a,b,c])=><section key={a}><b>{a}</b><strong>{b}</strong><span>{c}</span></section>)}</div>;
 if(kind==='relationship')return <div><div className="relation4"><section><h2>{s.items[0][0]}</h2><p>{s.items[0][1]}</p></section><div className="arrows4"><span>연산 · 유통 →</span><span>← 사용료 · 수요</span></div><section><h2>{s.items[1][0]}</h2><p>{s.items[1][1]}</p></section></div><div className="under4">{s.under}</div></div>;
 if(kind==='news')return <div><div className="newsLabel">{s.under}</div><div className="news4">{s.items.map(([a,b],i)=><section key={a}><strong>{a}</strong><span>{b}</span></section>)}</div></div>;
 return <div><div className={'items4 '+kind}><Items s={s}/></div>{s.under&&<div className="under4">{s.under}</div>}</div>;
}
function Sources({s}){return <div className="sources4">{s.sources.map(([label,url])=><a href={url} key={url} target="_blank" rel="noreferrer">{label} ↗</a>)}</div>}
function Concept({s}){return <SlideFrame label={s.label}>
 <header className="conceptTitle"><h1>{s.title}</h1><p>{s.english}</p></header>
 <dl className="conceptRows">
  <div><dt>정의</dt><dd>{s.definition}</dd></div>
  <div><dt>본질적 의미</dt><dd>{s.meaning}</dd></div>
  <div className="mentalRow"><dt>기억할 멘탈모델</dt><dd>{s.mental}</dd></div>
 </dl>
 <p className="conceptImplication">{s.implication}</p><Sources s={s}/>
 </SlideFrame>}
window.OT_SLIDES=DATA.map(s=>({title:(s.title+' '+s.accent).trim(),note:s.note,render:()=>s.kind==='cover'?<SlideFrame dark label={s.label}><div className="cover"><span className="eyebrow">AI CONCEPTS & INDUSTRY</span><h1>{s.title}<br/><em>{s.accent}</em></h1><p>{s.subtitle}</p></div><div className="coverFoot">{s.bottom}</div></SlideFrame>:s.kind==='concept'?<Concept s={s}/>:<SlideFrame dark={s.dark} label={s.label||'FOUNDATION / AI INDUSTRY'}><SlideTitle>{s.title}<br/><em>{s.accent}</em></SlideTitle>{s.rail&&<Rail active={s.rail}/>}<div className={'body content4 '+(s.rail?'withRail':'')}>{s.tag&&<div className="tag4">{s.tag}</div>}<Exhibit s={s}/></div><BottomLine>{s.bottom}</BottomLine><Sources s={s}/></SlideFrame>}));
})();
