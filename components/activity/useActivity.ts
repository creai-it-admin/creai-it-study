'use client';
import {useCallback,useEffect,useState,useRef} from 'react';
import type {ActivityData} from '@/lib/activity/types';
export function useActivity(id:string){
 const fetching=useRef(false);
 const [data,setData]=useState<ActivityData|null>(null),[error,setError]=useState('');
 const refresh=useCallback(async()=>{if(fetching.current)return;fetching.current=true;try{const r=await fetch(`/api/activities/${id}`,{cache:'no-store',signal:AbortSignal.timeout(10000)});const body=await r.json();if(!r.ok)throw Error(body.error);setData(body);setError('');}catch(e){setError(e instanceof Error?e.message:'불러오지 못했습니다.');}finally{fetching.current=false}},[id]);
 useEffect(()=>{void refresh();const timer=setInterval(()=>{if(!document.hidden)void refresh()},5000);return()=>clearInterval(timer)},[refresh]);
 return {data,error,refresh};
}
export async function activityAction(id:string,body:unknown){const r=await fetch(`/api/activities/${id}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(10000)});const result=await r.json();if(!r.ok)throw Error(result.error??'저장하지 못했습니다.');return result;}
