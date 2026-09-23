import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseApplication, koreaToday, ApplicationInputError } from '../lib/education-applications';
const now = new Date('2026-09-22T06:00:00Z');
const input = { id: '80421bb7-3e9e-4d21-b3ab-15a529e78ec2', name: ' 신청 테스트 ', birthDate: '1995-02-28', phone: '010-0000-0000', referral: '지인 추천', availableFrom: '2026-09-26', timeBlocks: ['14-16', '10-12'], consent: true };
test('normalizes phone and multiple slots while preserving calendar dates', () => {
 const row = parseApplication(input, now);
 assert.equal(row.name, '신청 테스트'); assert.equal(row.phone, '01000000000');
 assert.deepEqual(row.timeBlocks, ['10-12','14-16']);
 assert.equal(row.availableFrom.toISOString(), '2026-09-26T00:00:00.000Z');
});
test('rejects missing consent, slots, invalid dates and unsupported time blocks', () => {
 for (const [field, value] of [['consent', false], ['timeBlocks', []], ['timeBlocks', ['16-18']], ['birthDate', '1995-02-30'], ['birthDate', '2030-01-01'], ['availableFrom', '2026-09-19'], ['phone', 'not-a-phone'], ['referral', ''], ['name', ''], ['id', 'not-a-uuid']] as const) {
  assert.throws(() => parseApplication({ ...input, [field]: value }, now), ApplicationInputError);
 }
 assert.throws(() => parseApplication(null, now), ApplicationInputError);
});
test('accepts Sunday-only, both days and all six slots without reinterpreting Saturday values', () => {
 const sunday = parseApplication({ ...input, availableFrom: '2026-09-27', timeBlocks: ['sun-10-12'] }, now);
 assert.deepEqual(sunday.timeBlocks, ['sun-10-12']);
 assert.equal(sunday.availableFrom.toISOString(), '2026-09-27T00:00:00.000Z');
 assert.deepEqual(parseApplication({ ...input, timeBlocks: ['sun-10-12', '10-12'] }, now).timeBlocks, ['10-12', 'sun-10-12']);
 assert.equal(parseApplication({ ...input, timeBlocks: ['10-12','12-14','14-16','sun-10-12','sun-12-14','sun-14-16'] }, now).timeBlocks.length, 6);
});
test('availableFrom is a date threshold, with Korea-local past-date validation', () => {
 assert.equal(koreaToday(new Date('2026-09-26T15:00:00Z')), '2026-09-27');
 assert.equal(parseApplication({ ...input, availableFrom: '2026-09-23' }, now).availableFrom.toISOString(), '2026-09-23T00:00:00.000Z');
 assert.throws(() => parseApplication(input, new Date('2026-09-26T15:00:00Z')), ApplicationInputError);
});
