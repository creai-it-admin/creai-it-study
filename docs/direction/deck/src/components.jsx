// CREAI+IT HTML system. Theme tokens and shared primitives precede all slides.
const C = {ink:'var(--ink)', accent:'var(--blue)', paper:'var(--paper)'};
function BrandMark(){return <div className="brand">CREAI<b>+</b>IT</div>}
function SlideFrame({children,variant=''}){return <article className={'slide '+variant}><header className="chrome"><BrandMark/><span className="meta">AI STUDY · OUR DIRECTION</span></header>{children}</article>}
function Heading({eyebrow,title,children}){return <><p className="eyebrow">{eyebrow}</p><h1 className="title">{title}</h1>{children&&<p className="subtitle">{children}</p>}</>}
function Takeaway({children}){return <p className="takeaway">{children}</p>}
function Scope({personal=false,children}){return <div className={'scope-label'+(personal?' personal':'')}>{children}</div>}
function Node({code,title,children}){return <section className="tree-node"><h3><span className="code">{code}</span>{title}</h3>{children}</section>}
Object.assign(window,{C,BrandMark,SlideFrame,Heading,Takeaway,Scope,Node});
