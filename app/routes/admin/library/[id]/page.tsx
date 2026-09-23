import Link from 'next/link';
import {notFound,redirect} from 'next/navigation';
import {requireAdmin} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import {librarySlot} from '@/lib/library';
import {DeckViewer} from '@/app/routes/deck/DeckViewer';
import {LibraryUpload} from '../LibraryUpload';
import {ApplyVersion} from './ApplyVersion';
export const dynamic='force-dynamic';
export default async function AssetPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{version?:string}>}){
 if(!await requireAdmin())redirect('/routes/login');
 const {id}=await params,q=await searchParams;
 const asset=await prisma.libraryAsset.findUnique({where:{id},include:{versions:{orderBy:{number:'desc'}}}});
 if(!asset||!asset.versions.length)notFound();
 const version=q.version?asset.versions.find(v=>v.id===q.version):asset.versions[0];if(!version)notFound();
 const studies=await prisma.study.findMany({where:asset.weekNo===0?{}:{sessions:{some:{weekNo:asset.weekNo,status:'scheduled'}}},orderBy:{createdAt:'desc'},select:{id:true,name:true,otPath:true,sessions:{where:{weekNo:asset.weekNo},select:{deckPath:true,_count:{select:{materials:true}}}}}});
 const targets=studies.map(s=>({id:s.id,name:s.name,otPath:s.otPath,hasMaterial:s.sessions.some(v=>!!v.deckPath||v._count.materials>0)}));
 return <main className="mx-auto max-w-6xl px-5 py-8"><Link className="text-sm text-accent-strong" href="/routes/admin/library">← 공통 자료실</Link><p className="mt-5 text-sm text-accent-strong">FOUNDATION · {librarySlot(asset.weekNo)}</p><h1 className="mb-4 mt-1 text-2xl font-semibold">{asset.title}</h1><LibraryUpload asset={{id:asset.id,title:asset.title,weekNo:asset.weekNo}}/>
 <nav aria-label="자료 버전" className="my-5 flex flex-wrap gap-2">{asset.versions.map(v=><Link key={v.id} className={`btn ${version.id===v.id?'btn-primary':''}`} href={`/routes/admin/library/${id}?version=${v.id}`} aria-current={version.id===v.id?'page':undefined}>v{v.number}{v.id===asset.versions[0].id?' · 최신':''}</Link>)}</nav><p className="mb-5 text-sm text-ink-2">{version.createdAt.toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'})}{version.note?` · ${version.note}`:''}</p>
 <ApplyVersion key={version.id} versionId={version.id} number={version.number} weekNo={asset.weekNo} targets={targets}/><div className="mt-5"><DeckViewer src={`/api/admin/library/${version.id}/html`} title={`${asset.title} v${version.number}`}/></div></main>;
}
