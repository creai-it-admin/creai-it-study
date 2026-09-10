import {NextResponse} from 'next/server';
import {requireAdmin} from '@/lib/auth';
import {createStudy,StudyInputError} from '@/lib/studies';
export async function POST(req:Request){
 if(!await requireAdmin())return NextResponse.json({error:'운영진만 스터디를 만들 수 있습니다.'},{status:403});
 try{return NextResponse.json(await createStudy(await req.json().catch(()=>null)),{status:201});}
 catch(error){return NextResponse.json({error:error instanceof StudyInputError?error.message:'스터디를 만들지 못했습니다. 다시 시도해 주세요.'},{status:error instanceof StudyInputError?400:500});}
}
