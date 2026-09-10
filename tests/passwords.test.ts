import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hashPassword, verifyPassword, validPassword, normalizeEmail } from '../lib/passwords';

test('password hashes use unique salts and reject wrong passwords', async () => {
  const password = 'a sufficiently long password';
  const a = await hashPassword(password);
  const b = await hashPassword(password);
  assert.notEqual(a, b);
  assert.equal(a.includes(password), false);
  assert.equal(await verifyPassword(password, a), true);
  assert.equal(await verifyPassword('wrong password', a), false);
  assert.equal(await verifyPassword(password, null), false);
  assert.equal(await verifyPassword(password, 'corrupt'), false);
});
test('credentials enforce length bounds without trimming passwords', () => {
  assert.equal(validPassword('short'), false);
  assert.equal(validPassword('a'.repeat(9)), false);
  assert.equal(validPassword('a'.repeat(10)), true);
  assert.equal(validPassword('a'.repeat(129)), false);
  assert.equal(normalizeEmail('  Member@Example.com '), 'member@example.com');
  assert.equal(normalizeEmail('not-an-email'), null);
});
