import {prisma} from './prisma';
export class StudyInputError extends Error {}
export function parseStudyInput(input:unknown){
 const data=input as {name?:unknown;dates?:unknown}|null;
 if(!data||typeof data.name!=='string'||!data.name.trim()||data.name.trim().length>120)throw new StudyInputError('스터디 이름을 1~120자로 입력해 주세요.');
 if(!Array.isArray(data.dates)||data.dates.length!==4)throw new StudyInputError('1~4주차 날짜를 모두 입력해 주세요.');
 const dates=data.dates.map(value=>{
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new StudyInputError('올바른 회차 날짜를 입력해 주세요.');
  const date=new Date(`${value}T00:00:00.000Z`);
  if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==value)throw new StudyInputError('올바른 회차 날짜를 입력해 주세요.');
  return date;
 });
 if(dates.some((date,i)=>i>0&&date<=dates[i-1]))throw new StudyInputError('회차 날짜는 1주차부터 순서대로 설정해 주세요.');
 return {name:data.name.trim(),dates};
}
export async function createStudy(input:unknown){
 const {name,dates}=parseStudyInput(input);
 return prisma.study.create({data:{name,sessions:{create:dates.map((date,i)=>({weekNo:i+1,date}))}},select:{id:true}});
}
