import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

function jpegWithExif(){
  const tiff=new Uint8Array(68),v=new DataView(tiff.buffer),ascii=(s,o)=>{for(let i=0;i<s.length;i++)tiff[o+i]=s.charCodeAt(i);};
  ascii('II',0);v.setUint16(2,42,true);v.setUint32(4,8,true);v.setUint16(8,3,true);
  const entry=(i,tag,type,count,value)=>{const p=10+i*12;v.setUint16(p,tag,true);v.setUint16(p+2,type,true);v.setUint32(p+4,count,true);v.setUint32(p+8,value,true);};
  entry(0,0x010f,2,6,50);entry(1,0x0131,2,10,56);entry(2,0x8825,4,1,66);ascii('Canon\0',50);ascii('Editor 1\0\0',56);v.setUint16(66,0,true);
  const payload=new Uint8Array(6+tiff.length);payload.set([69,120,105,102,0,0]);payload.set(tiff,6);
  const bytes=new Uint8Array(2+2+2+payload.length);bytes.set([0xff,0xd8,0xff,0xe1]);new DataView(bytes.buffer).setUint16(4,payload.length+2,false);bytes.set(payload,6);return new Blob([bytes],{type:'image/jpeg'});
}

test('EXIF reader returns only non-identifying review signals and GPS presence',async()=>{
  const window={};
  runInNewContext(readFileSync(new URL('../public/exif-metadata.js',import.meta.url),'utf8'),{window,Blob,TextDecoder,DataView,Uint8Array,Map,Set,Math,String,Object});
  const metadata=await window.bpmReadExifMetadata(jpegWithExif());
  assert.deepEqual({...metadata},{camera_make:'Canon',software:'Editor 1',gps_data_present:true});
  assert.equal('gps_latitude' in metadata,false);
  assert.equal('serial_number' in metadata,false);
  assert.equal('artist' in metadata,false);
});

test('privacy notice documents local EXIF filtering and post-review deletion in all locales',()=>{
  const page=readFileSync(new URL('../public/privacy.html',import.meta.url),'utf8');
  const theme=readFileSync(new URL('../public/theme.js',import.meta.url),'utf8');
  assert.match(page,/privacy\.exif\.body/);
  assert.match(theme,/GPS coordinates, device serial numbers, author names, and comments are not read or stored/);
  assert.match(theme,/GPS 座標、裝置序號、作者名稱或備註/);
  assert.match(page,/GPS 坐标、设备序列号、作者、备注等可识别信息/);
});
