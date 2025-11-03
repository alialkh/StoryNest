import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stripSuggestion, truncateWords, extractSuggestion } from '../src/utils/text';

test('stripSuggestion removes **suggestion** segments', () => {
  const input = 'This is the story content. **Ask about the key**';
  const out = stripSuggestion(input);
  assert.strictEqual(out, 'This is the story content.');
});

test('stripSuggestion handles no suggestion', () => {
  const input = 'No suggestion here.';
  assert.strictEqual(stripSuggestion(input), 'No suggestion here.');
});

test('extractSuggestion returns suggestion text or null', () => {
  const input = 'Ends with a hint. **Try asking about the door**';
  assert.strictEqual(extractSuggestion(input), 'Try asking about the door');
  assert.strictEqual(extractSuggestion('Nothing'), null);
});

test('truncateWords limits to max words', () => {
  const words = Array.from({ length: 60 }).map((_, i) => `w${i + 1}`).join(' ');
  const truncated = truncateWords(words, 50);
  const parts = truncated.split(/\s+/);
  assert.strictEqual(parts.length, 50);
  assert.ok(truncated.endsWith('…'));
});

test('truncateWords returns original when short', () => {
  const s = 'One two three';
  assert.strictEqual(truncateWords(s, 50), s);
});
