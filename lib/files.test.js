import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeUpload, orderFile, mimeFor } from './files.js';

const pdfBuf = (pages) => {
  let s = '%PDF-1.4\n';
  for (let i = 0; i < pages; i++) s += 'x /Type /Page ';
  return Buffer.from(s, 'latin1');
};
const pngBuf = () => Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const jpgBuf = () => Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

test('pdf keeps its real page count', () => {
  assert.deepEqual(analyzeUpload('notes.pdf', pdfBuf(12)), { fileType: 'pdf', ext: 'pdf', pages: 12 });
});

test('png and jpg count as one page', () => {
  assert.deepEqual(analyzeUpload('photo.PNG', pngBuf()), { fileType: 'image', ext: 'png', pages: 1 });
  assert.deepEqual(analyzeUpload('scan.jpeg', jpgBuf()), { fileType: 'image', ext: 'jpg', pages: 1 });
});

test('renamed executables and office docs are rejected', () => {
  assert.throws(() => analyzeUpload('evil.pdf', pngBuf()), /no readable pages/);
  assert.throws(() => analyzeUpload('notes.pdf', Buffer.from('MZ' + 'x'.repeat(100))), /no readable pages/);
  assert.throws(() => analyzeUpload('photo.png', Buffer.from('MZ' + 'x'.repeat(100))), /PDF, PNG or JPG only/);
  assert.throws(() => analyzeUpload('deck.pptx', Buffer.from('PK' + 'x'.repeat(100))), /not supported yet/);
  assert.throws(() => analyzeUpload('doc.docx', Buffer.from('PK' + 'x'.repeat(100))), /not supported yet/);
  assert.throws(() => analyzeUpload('a.pdf', Buffer.alloc(0)), /empty/);
});

test('orderFile keeps legacy pdf default and sanitizes', () => {
  assert.equal(orderFile('PK-1047', undefined), 'PK-1047.pdf');
  assert.equal(orderFile('PK-1047', 'jpg'), 'PK-1047.jpg');
  assert.equal(orderFile('PK-1047', 'jpeg'), 'PK-1047.jpg');
  assert.equal(orderFile('PK-1047', 'exe'), 'PK-1047.pdf');
  assert.equal(orderFile('../evil', 'pdf'), 'evil.pdf');
});

test('mimeFor maps image extensions', () => {
  assert.equal(mimeFor('png'), 'image/png');
  assert.equal(mimeFor('jpg'), 'image/jpeg');
  assert.equal(mimeFor(), 'application/pdf');
});
