(() => {
const root=ReactDOM.createRoot(document.getElementById('slide-root'));
const slides=window.OT_SLIDES;
const single=document.body.dataset.single;
let current=0;
const $=id=>document.getElementById(id);
function scale(){const v=$('viewport');$('stage').style.transform=`scale(${Math.min(v.clientWidth/1600,v.clientHeight/900)})`}
function go(n){current=Math.max(0,Math.min(slides.length-1,n));root.render(React.createElement(slides[current].render));if(!single){$('counter').textContent=`${current+1} / ${slides.length}`;$('current').textContent=slides[current].title;$('previous').disabled=current===0;$('next').disabled=current===slides.length-1;document.querySelectorAll('#toclist button').forEach((b,i)=>b.setAttribute('aria-current',String(i===current)));history.replaceState(null,'','#'+(current+1));}scale();}
function notes(){ $('notesTitle').textContent=slides[current].title;$('notesText').textContent=slides[current].note;$('notes').showModal();}
if(!single){
 slides.forEach((slide,i)=>{const b=document.createElement('button');b.textContent=`${i+1}. ${slide.title}`;b.onclick=()=>{$('toc').close();go(i)};$('toclist').appendChild(b)});
 $('previous').onclick=()=>go(current-1);$('next').onclick=()=>go(current+1);$('tocButton').onclick=()=>$('toc').showModal();$('notesButton').onclick=notes;
 $('fullButton').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{$('notesTitle').textContent='전체화면 안내';$('notesText').textContent='브라우저의 전체화면 기능을 사용해 주세요.';$('notes').showModal()}};
 document.querySelectorAll('dialog .close').forEach(b=>b.onclick=()=>b.closest('dialog').close());
 document.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]')||e.metaKey||e.ctrlKey||e.altKey)return;const key=e.key.toLowerCase();if(['arrowright','pagedown',' '].includes(key)){e.preventDefault();go(current+1)}else if(['arrowleft','pageup'].includes(key)){e.preventDefault();go(current-1)}else if(key==='home'){e.preventDefault();go(0)}else if(key==='end'){e.preventDefault();go(slides.length-1)}else if(key==='g')$('tocButton').click();else if(key==='n')notes();else if(key==='f')$('fullButton').click();});
 window.addEventListener('hashchange',()=>go((parseInt(location.hash.slice(1))||1)-1));
}
window.addEventListener('resize',scale);new ResizeObserver(scale).observe($('viewport'));
go(single?Number(single)-1:(parseInt(location.hash.slice(1))||1)-1);document.fonts.ready.then(scale);
})();
