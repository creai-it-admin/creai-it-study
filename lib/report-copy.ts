export async function copyReportHtml(url:string):Promise<{copied:boolean;html:string}>{
 const response=await fetch(url,{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(15000)});
  if(response.status===401||response.redirected)throw Error('로그인 상태를 확인한 뒤 다시 시도해 주세요.');
  if(!response.ok||!response.headers.get('content-type')?.includes('text/html'))throw Error('리포트를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
  const html=await response.text();
  if(!html.trim())throw Error('리포트 내용이 비어 있습니다.');
 try{
  if(!navigator.clipboard?.writeText)return {copied:false,html};
  await navigator.clipboard.writeText(html);
  return {copied:true,html};
 }catch{return {copied:false,html};}
}
