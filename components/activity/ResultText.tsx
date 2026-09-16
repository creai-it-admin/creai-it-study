export function ResultText({text}:{text:string}){
 return <p className="whitespace-pre-wrap break-words text-sm leading-7">{text?text.split(/(https?:\/\/[^\s<>]+)/g).map((part,i)=>/^https?:\/\//.test(part)?<a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-accent-strong underline underline-offset-4 break-all">{part}</a>:part):<span className="text-ink-3">아직 작성하지 않았습니다.</span>}</p>;
}
