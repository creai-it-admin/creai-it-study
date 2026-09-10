import assert from 'node:assert/strict';
import {test} from 'node:test';
import {parseStudyInput} from '../lib/studies';
const dates=['2026-09-12','2026-09-19','2026-10-03','2026-10-10'];
test('a study has a name and four independently chosen dates, including holiday skips',()=>{
 const value=parseStudyInput({name:'  1기 스터디  ',dates});
 assert.equal(value.name,'1기 스터디');assert.deepEqual(value.dates.map(d=>d.toISOString().slice(0,10)),dates);
});
test('invalid or incomplete schedules cannot create a partial study',()=>{
 for(const input of [null,{}, {name:' ',dates},{name:'x',dates:dates.slice(1)}, {name:'x',dates:['2026-02-30',...dates.slice(1)]},{name:'x',dates:[dates[0],dates[0],...dates.slice(2)]},{name:'x',dates:[...dates].reverse()}])assert.throws(()=>parseStudyInput(input));
});
