// Read a small, non-sensitive EXIF summary from the original image locally.
// GPS coordinates and device serial numbers are deliberately never returned.
(() => {
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const clean = value => String(value || '').replace(/[\0\x00-\x1f\x7f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
  const allowed = new Set([0x010f, 0x0110, 0x0131, 0x9003, 0x9004]);
  const names = new Map([[0x010f,'camera_make'],[0x0110,'camera_model'],[0x0131,'software'],[0x9003,'date_taken'],[0x9004,'digitized_at']]);
  const parse = bytes => {
    let view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), tiff = -1;
    if (view.byteLength >= 4 && view.getUint16(0) === 0xffd8) {
      for (let i=2; i+4<=view.byteLength;) { if(view.getUint8(i)!==0xff)break; const marker=view.getUint8(i+1),len=view.getUint16(i+2); if(len<2||i+2+len>view.byteLength)break; if(marker===0xe1&&decoder.decode(bytes.subarray(i+4,i+10))==='Exif\0\0'){tiff=i+10;break;} i+=2+len; }
    } else if (view.byteLength >= 8 && decoder.decode(bytes.subarray(0,4))==='RIFF' && decoder.decode(bytes.subarray(8,12))==='WEBP') {
      for(let i=12;i+8<=view.byteLength;){const type=decoder.decode(bytes.subarray(i,i+4)),len=view.getUint32(i+4,true);if(i+8+len>view.byteLength)break;if(type==='EXIF'){tiff=i+8;if(decoder.decode(bytes.subarray(tiff,tiff+6))==='Exif\0\0')tiff+=6;break;}i+=8+len+(len&1);}
    } else if (view.byteLength >= 8 && view.getUint32(0)===0x89504e47) {
      for(let i=8;i+12<=view.byteLength;){const len=view.getUint32(i),type=decoder.decode(bytes.subarray(i+4,i+8));if(i+12+len>view.byteLength)break;if(type==='eXIf'){tiff=i+8;break;}i+=12+len;}
    }
    if(tiff<0||tiff+8>view.byteLength)return null;
    const little=decoder.decode(bytes.subarray(tiff,tiff+2))==='II';
    if(!little&&decoder.decode(bytes.subarray(tiff,tiff+2))!=='MM')return null;
    const u16=o=>view.getUint16(o,little),u32=o=>view.getUint32(o,little),base=tiff;
    if(u16(base+2)!==42)return null;
    const result={}; let gps=false;
    const readIfd=(offset,depth=0)=>{
      if(depth>2||offset+2>view.byteLength)return;
      const count=Math.min(u16(offset),64);
      for(let n=0;n<count;n++){
        const p=offset+2+n*12;if(p+12>view.byteLength)break;const tag=u16(p),type=u16(p+2),num=u32(p+4);
        if(tag===0x8825){gps=true;continue;}
        if(!allowed.has(tag)||!num||num>512)continue;
        const unit=({1:1,2:1,3:2,4:4,7:1,5:8,10:8})[type];if(!unit)continue;const size=unit*num,at=size<=4?p+8:base+u32(p+8);if(at<0||at+size>view.byteLength)continue;
        let value='';
        if(type===2||type===7){let raw=bytes.subarray(at,at+Math.min(size,512));if(tag===0x9286&&raw.length>8)raw=raw.subarray(8);value=clean(decoder.decode(raw));}
        else if(type===3||type===4)value=String(type===3?u16(at):u32(at));
        if(value)result[names.get(tag)]=value;
        if(tag===0x8769&&type===4)readIfd(base+u32(p+8),depth+1);
      }
    };
    readIfd(base+u32(base+4));
    if(gps)result.gps_data_present=true;
    return Object.keys(result).length?result:null;
  };
  window.bpmReadExifMetadata = async file => {
    if(!(file instanceof Blob)||file.size>25*1024*1024)return null;
    const bytes=new Uint8Array(await file.arrayBuffer());
    try { const metadata=parse(bytes); if(!metadata)return null; return Object.fromEntries(Object.entries(metadata).slice(0,16)); } catch { return null; }
  };
})();
