"use client";
import {useLiveState} from '@/components/useLiveState';
import {SessionStatus} from '@/components/SessionStatus';
export function DeckFrame({children}:{children:React.ReactNode}){
 const {state}=useLiveState();
 return <div className="flex flex-col gap-4"><SessionStatus state={state}/>{children}</div>;
}
