import Link from 'next/link';
import {materialHref,materialLabels,type MaterialItem} from '@/lib/materials';
export function MaterialLinks({sessionId,materials,deckPath}:{sessionId:string;materials:MaterialItem[];deckPath?:string|null}){
 return <>{materials.map(m=><Link key={m.id} className="btn text-sm" href={materialHref(sessionId,m.id)}>{materialLabels[m.kind]} · {m.title}</Link>)}{!materials.length&&deckPath&&<Link className="btn" href={materialHref(sessionId)}>교육 자료</Link>}</>;
}
