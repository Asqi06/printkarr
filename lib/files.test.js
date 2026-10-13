import { PDFDocument } from 'pdf-lib';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeUpload, orderFile, mimeFor } from './files.js';
import { deflateSync } from 'node:zlib';

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

test('PNG decompression dimensions are bounded before decoding', async () => {
  const image=pngBuf();image.writeUInt32BE(100000,16);image.writeUInt32BE(100000,20);
  await assert.rejects(analyzeUpload('too-large.png',image),/16 megapixels/);
});

test('small-header PNG inflation bombs and animated frame dimensions never reach the decoder', async () => {
  const header=Buffer.from(pngBuf().subarray(0,33));header.writeUInt32BE(1,16);header.writeUInt32BE(1,20);
  const chunk=(type,bytes)=>{const result=Buffer.alloc(bytes.length+12);result.writeUInt32BE(bytes.length);result.write(type,4,'ascii');bytes.copy(result,8);return result;};
  const pixels=deflateSync(Buffer.alloc(1024*1024));
  await assert.rejects(analyzeUpload('bomb.png',Buffer.concat([header,chunk('IDAT',pixels),chunk('IEND',Buffer.alloc(0))])),/oversized pixel data/);
  await assert.rejects(analyzeUpload('animated.png',Buffer.concat([header,chunk('acTL',Buffer.alloc(8)),chunk('IEND',Buffer.alloc(0))])),/animated PNG/);
});

test('mimeFor maps image extensions', () => {
  assert.equal(mimeFor('png'), 'image/png');
  assert.equal(mimeFor('jpg'), 'image/jpeg');
  assert.equal(mimeFor(), 'application/pdf');
});
