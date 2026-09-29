import type {ReactNode} from 'react';
// Markdown links first: AI answers cite sources as [label](url), and the bare-URL pattern would swallow the closing parenthesis.
const LINK=/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)|https?:\/\/[^\s<>]+/g;
export function ResultText({text}:{text:string}){
 const parts:ReactNode[]=[];let last=0;
 for(const m of text.matchAll(LINK)){const href=m[2]??m[0];parts.push(text.slice(last,m.index),<a key={m.index} href={href} target="_blank" rel="noopener noreferrer" className="text-accent-strong underline underline-offset-4 break-all">{m[1]??href}</a>);last=m.index+m[0].length}
 parts.push(text.slice(last));
 return <p className="whitespace-pre-wrap break-words text-sm leading-7">{text?parts:<span className="text-ink-3">아직 작성하지 않았습니다.</span>}</p>;
}
