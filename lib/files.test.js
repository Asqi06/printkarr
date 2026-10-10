import { PDFDocument } from 'pdf-lib';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeUpload, orderFile, mimeFor } from './files.js';

const pdfBuf = async (pages) => { const pdf=await PDFDocument.create(); for(let n=0;n<pages;n++)pdf.addPage(); return Buffer.from(await pdf.save()); };
const pngBuf = () => readFileSync(new URL('../public/favicon-32x32.png', import.meta.url));
const jpgBuf = () => readFileSync(new URL('../public/images/host-cta.jpg', import.meta.url));

test('pdf keeps its real page count', async () => {
  assert.deepEqual(await analyzeUpload('notes.pdf', await pdfBuf(12)), { fileType: 'pdf', ext: 'pdf', pages: 12 });
});

test('png and jpg count as one page', async () => {
  assert.deepEqual(await analyzeUpload('photo.PNG', pngBuf()), { fileType: 'image', ext: 'png', pages: 1 });
  assert.deepEqual(await analyzeUpload('scan.jpeg', jpgBuf()), { fileType: 'image', ext: 'jpg', pages: 1 });
});

test('renamed executables and office docs are rejected', async () => {
  await assert.rejects(() => analyzeUpload('evil.pdf', pngBuf()), /no readable pages/);
  await assert.rejects(() => analyzeUpload('notes.pdf', Buffer.from('MZ' + 'x'.repeat(100))), /no readable pages/);
  await assert.rejects(() => analyzeUpload('photo.png', Buffer.from('MZ' + 'x'.repeat(100))), /PDF, PNG or JPG only/);
  await assert.rejects(() => analyzeUpload('deck.pptx', Buffer.from('PK' + 'x'.repeat(100))), /not supported yet/);
  await assert.rejects(() => analyzeUpload('doc.docx', Buffer.from('PK' + 'x'.repeat(100))), /not supported yet/);
  await assert.rejects(() => analyzeUpload('a.pdf', Buffer.alloc(0)), /empty/);
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
