// Preserve existing Saturday values so earlier applications and filters remain valid.
export const TIME_BLOCKS = [
  { value: '10-12', day: '토요일', label: '토요일 10:00–12:00', time: '10:00–12:00', period: '오전' },
  { value: '12-14', day: '토요일', label: '토요일 12:00–14:00', time: '12:00–14:00', period: '낮' },
  { value: '14-16', day: '토요일', label: '토요일 14:00–16:00', time: '14:00–16:00', period: '오후' },
  { value: 'sun-10-12', day: '일요일', label: '일요일 10:00–12:00', time: '10:00–12:00', period: '오전' },
  { value: 'sun-12-14', day: '일요일', label: '일요일 12:00–14:00', time: '12:00–14:00', period: '낮' },
  { value: 'sun-14-16', day: '일요일', label: '일요일 14:00–16:00', time: '14:00–16:00', period: '오후' },
] as const;
export function koreaToday(now = new Date()) {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
export class ApplicationInputError extends Error {
  constructor(public field: string, message: string) { super(message); }
}
function dateOnly(value: unknown, field: string) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new ApplicationInputError(field, '날짜를 선택해 주세요.');
  const date = new Date(value + 'T00:00:00Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new ApplicationInputError(field, '올바른 날짜를 입력해 주세요.');
  return date;
}
export function parseApplication(input: unknown, now = new Date()) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ApplicationInputError('form', '입력 내용을 확인해 주세요.');
  const data = input as Record<string, unknown>;
  const text = (key: string, label: string, max: number) => {
    const value = typeof data[key] === 'string' ? data[key].trim() : '';
    if (!value || value.length > max) throw new ApplicationInputError(key, `${label}을(를) ${max}자 이내로 입력해 주세요.`);
    return value;
  };
  const id = text('id', '신청 번호', 36);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) throw new ApplicationInputError('form', '페이지를 새로고침한 뒤 다시 시도해 주세요.');
  const name = text('name', '이름', 50);
  const birthDate = dateOnly(data.birthDate, 'birthDate');
  if (birthDate.toISOString().slice(0,10) >= koreaToday(now) || birthDate.getUTCFullYear() < 1900) throw new ApplicationInputError('birthDate', '생년월일을 다시 확인해 주세요.');
  const phone = text('phone', '휴대전화 번호', 20).replace(/[\s-]/g, '');
  if (!/^01[016789]\d{7,8}$/.test(phone)) throw new ApplicationInputError('phone', '연락 가능한 휴대전화 번호를 입력해 주세요.');
  const referral = text('referral', '알게 된 경로', 100);
  const availableFrom = dateOnly(data.availableFrom, 'availableFrom');
  if (availableFrom.toISOString().slice(0,10) < koreaToday(now)) throw new ApplicationInputError('availableFrom', '오늘부터 참여 가능한 시작일을 선택해 주세요.');
  const timeBlocks = data.timeBlocks;
  if (!Array.isArray(timeBlocks) || !timeBlocks.length || timeBlocks.length > TIME_BLOCKS.length || timeBlocks.some(v => !TIME_BLOCKS.some(b => b.value === v))) throw new ApplicationInputError('timeBlocks', '참여 가능한 시간대를 하나 이상 선택해 주세요.');
  if (data.consent !== true) throw new ApplicationInputError('consent', '신청 접수를 위한 개인정보 수집·이용에 동의해 주세요.');
  return { id, name, birthDate, phone, referral, availableFrom, timeBlocks: TIME_BLOCKS.filter(b => timeBlocks.includes(b.value)).map(b => b.value) };
}
