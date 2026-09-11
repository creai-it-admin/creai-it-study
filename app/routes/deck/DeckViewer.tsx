"use client";
import {useRef} from 'react';
export function DeckViewer({sessionId}:{sessionId:string}){
 const frame=useRef<HTMLIFrameElement>(null);
 return <div className="flex flex-col gap-3">
  <div className="flex justify-end"><button className="btn" onClick={()=>void frame.current?.requestFullscreen().catch(()=>{})}>전체 화면</button></div>
  <iframe ref={frame} title="HTML 장표" src={`/api/sessions/${sessionId}/deck`} sandbox="allow-scripts" allow="fullscreen" referrerPolicy="no-referrer" className="h-[75dvh] min-h-[420px] w-full rounded-lg border border-line bg-white" />
 </div>;
}
