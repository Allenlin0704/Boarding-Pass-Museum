import {readFileSync,readdirSync} from 'node:fs';import {spawnSync} from 'node:child_process';
const files=new Set(readdirSync('worker').filter(f=>/\.m?js$/.test(f)).map(f=>'worker/'+f));
for(const html of readdirSync('public').filter(f=>f.endsWith('.html'))) {
 const source=readFileSync('public/'+html,'utf8');
 for(const match of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
  const src=match[1].match(/src="([^"?]+)(?:\?[^"]*)?"/);
  if(src&&!src[1].startsWith('http')) files.add('public/'+src[1]);
  else if(match[2].trim()){const checked=spawnSync(process.execPath,['--check'],{input:match[2],encoding:'utf8'});if(checked.status!==0)throw Error(html+': '+checked.stderr);}
 }
}
for(const file of files){const checked=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(checked.status!==0)throw Error(file+': '+checked.stderr);}
console.log(`${files.size} active JavaScript files and inline scripts passed syntax checks.`);
