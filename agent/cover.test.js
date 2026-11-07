import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PDFDocument, PDFArray, PDFRawStream} from 'pdf-lib';
import {buildOrderCover} from './cover.js';

test('branded cover preserves the supplied artwork, page bounds and QR resources',async()=>{
 const original=await PDFDocument.load(fs.readFileSync(new URL('./assets/order-cover.pdf',import.meta.url)));
 const order={id:'PK-COVER-CHECK',document:'Semester notes.pdf',pages:68,copies:2,sides:'double',paper:'A4',printType:'mixed',bwPages:60,colorPages:8};
 const result=await PDFDocument.load(await buildOrderCover(order,new Date('2026-10-07T10:30:00Z')));
 assert.equal(result.getPageCount(),1);assert.equal(result.getTitle(),'PrintKarr cover - PK-COVER-CHECK');
 const source=original.getPage(0),page=result.getPage(0);
 assert.deepEqual(page.getMediaBox(),source.getMediaBox());assert.deepEqual(page.getCropBox(),source.getCropBox());assert.deepEqual(page.getRotation(),source.getRotation());
 const content=page.node.Contents();assert.ok(content instanceof PDFArray);
 const streams=content.asArray().map(ref=>result.context.lookup(ref));
 assert.ok(streams.some(stream=>stream instanceof PDFRawStream && Buffer.from(stream.getContents()).equals(Buffer.from(source.node.Contents().getContents()))),'Original artwork stream is unchanged');
 assert.equal(page.node.Resources().toString().includes('/XObject'),source.node.Resources().toString().includes('/XObject'));
});

test('long, multiline and non-Latin metadata cannot prevent cover printing',async()=>{
 const bytes=await buildOrderCover({id:'PK-'+'A'.repeat(160),document:'हिन्दी_日本語\n'+ 'very-long-filename-'.repeat(25),pages:1000,copies:200,printType:'color',sides:'single'},new Date('2026-10-07T10:30:00Z'));
 assert.equal((await PDFDocument.load(bytes)).getPageCount(),1);
});
