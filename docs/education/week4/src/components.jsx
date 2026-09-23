(() => {
const C={bg:'#f3f9ff',ink:'#102b50',muted:'#526f8e',accent:'#2563eb',line:'#bed4e9',paper:'#ffffff',bright:'#79caff',darkMuted:'#afc8df'};
const TYPE_SCALE={display:96,title:56,heading:40,body:30,label:24,micro:18,metric:164};
const SPACING={edge:80,top:56,body:350};
function BrandMark(){return <div className="brand">CREAI<span>+</span>IT <small>EDU</small></div>}
function SlideFrame({children,dark=false,label=''}){return <article className={`slide ${dark?'dark':''}`}><header className="chrome"><BrandMark/><span>{label}</span></header>{children}</article>}
function SlideTitle({children}){return <h1 className="title">{children}</h1>}
function SourceNote({href,children}){return <a className="source" href={href} target="_blank" rel="noreferrer">{children} ↗</a>}
function BottomLine({children}){return <p className="bottomLine">{children}</p>}
function Flow({items}){return <div className="flow">{items.map(([title,body],i)=><React.Fragment key={title}>{i>0&&<span className="flowArrow">→</span>}<div className="flowStep"><h2>{title}</h2>{body&&<p>{body}</p>}</div></React.Fragment>)}</div>}
function SourceLinks({children}){return <div className="sourceLinks">{children}</div>}
function Walkthrough({label,title,request,steps,watch,dark=false}){return <SlideFrame dark={dark} label={label}><SlideTitle>{title}</SlideTitle><div className="walkthrough"><div className="request"><span className="eyebrow">함께 입력할 요청</span><blockquote>{request}</blockquote></div><div className="watch"><span className="eyebrow">화면에서 볼 것</span>{watch.map(([a,b])=><div key={a}><h2>{a}</h2><p>{b}</p></div>)}</div></div><div className="walkSteps">{steps.map((s,i)=><React.Fragment key={s}>{i>0&&<span>→</span>}<strong>{s}</strong></React.Fragment>)}</div></SlideFrame>}
Object.assign(window,{C,TYPE_SCALE,SPACING,BrandMark,SlideFrame,SlideTitle,SourceNote,BottomLine,Flow,SourceLinks,Walkthrough});
})();
