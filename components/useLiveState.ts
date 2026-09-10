"use client";
import {useEffect,useState} from 'react';
export type LiveState={serverTime:string;sessionId:string|null;weekNo:number|null;studyName?:string|null;recordingState:string;sharingOpen:boolean;route:string};
// State updates never navigate: participants choose materials and writing themselves.
export function useLiveState(){
 const [state,setState]=useState<LiveState|null>(null);
 useEffect(()=>{
  let alive=true,busy=false;
  async function tick(){if(busy)return;busy=true;try{
   const res=await fetch('/api/state',{cache:'no-store',signal:AbortSignal.timeout(10000)});
   if(res.ok&&alive)setState(await res.json());
  }catch{/* Retry without discarding the current screen. */}finally{busy=false;}}
  void tick();const timer=setInterval(tick,3000);
  return()=>{alive=false;clearInterval(timer);};
 },[]);
 return {state};
}
