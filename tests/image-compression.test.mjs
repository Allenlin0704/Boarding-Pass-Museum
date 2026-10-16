import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

function imageTools({webpUnsupported=false}={}) {
  const canvases=[];
  class Canvas {
    width=0;height=0;
    getContext(){return {fillRect(){},drawImage(){}};}
    toBlob(callback,type,quality){
      const bytes=Math.max(1,Math.ceil(this.width*this.height*(Number(quality)||.8)*.55));
      canvases.push({width:this.width,height:this.height,type,quality,bytes});
      callback(new Blob([new Uint8Array(bytes)],{type:webpUnsupported&&type==='image/webp'?'image/png':type}));
    }
  }
  const window={};
  vm.runInNewContext(readFileSync(new URL('../public/image-compression.js',import.meta.url),'utf8'),{
    window,document:{createElement:()=>new Canvas()},Blob,File,Uint8Array,URL,
    createImageBitmap:async()=>({width:4000,height:3000,close(){}})
  });
  return {window,canvases};
}

test('image compressor clamps every caller to 1280px, 1 MB and WebP output',async()=>{
  const {window,canvases}=imageTools();
  const blob=await window.bpmCompressCanvas({width:4000,height:3000},{maxEdge:2600,maxBytes:4*1024*1024,quality:.9});
  assert.equal(blob.type,'image/webp');
  assert.ok(blob.size<=1024*1024);
  assert.ok(canvases.every(canvas=>Math.max(canvas.width,canvas.height)<=1280));
  assert.equal(window.bpmImagePolicy.maxEdge,1280);assert.equal(window.bpmImagePolicy.maxBytes,1024*1024);assert.equal(window.bpmImagePolicy.outputType,'image/webp');
  assert.equal(Array.from(window.bpmImagePolicy.inputTypes).join(','),'image/jpeg,image/jpg,image/png,image/heic,image/heif');
});

test('image compressor falls back to JPEG when browser cannot encode WebP',async()=>{
  const {window,canvases}=imageTools({webpUnsupported:true});
  const blob=await window.bpmCompressCanvas({width:2400,height:1600});
  assert.equal(blob.type,'image/jpeg');assert.ok(blob.size<=1024*1024);
  assert.ok(canvases.some(canvas=>canvas.type==='image/jpeg'));
});

test('image compressor accepts JPEG/PNG sources and rejects WebP or unrelated formats as originals',async()=>{
  const {window}=imageTools();
  const jpeg=new File([new Uint8Array([0xff,0xd8,0xff,0])],'camera.JPG',{type:'image/jpeg'});
  const png=new File([new Uint8Array([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])],'scan.png',{type:'image/png'});
  await window.bpmValidateImageFile(jpeg);await window.bpmValidateImageFile(png);
  await window.bpmValidateImageFile(new File([new Uint8Array([0,0,0,0,0x66,0x74,0x79,0x70])],'camera.HEIC',{type:'image/heic'}));
  await assert.rejects(window.bpmValidateImageFile(new File([new Uint8Array([0x52,0x49,0x46,0x46])],'source.webp',{type:'image/webp'})),/JPEG.*JPG.*PNG.*HEIC/);
  await assert.rejects(window.bpmValidateImageFile(new File([new Uint8Array([0x47,0x49,0x46,0x38])],'animated.gif',{type:'image/gif'})),/JPEG.*JPG.*PNG.*HEIC/);
});
