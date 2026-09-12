import {mkdirSync,readdirSync,copyFileSync} from 'node:fs';
import {join} from 'node:path';
const destination=process.argv[2];if(!destination||!destination.startsWith('/private/tmp/bpm-'))throw Error('Use a task-specific temporary output directory');
function copy(source,target){mkdirSync(target,{recursive:true});for(const entry of readdirSync(source,{withFileTypes:true})) {
 if(entry.name.startsWith('.')||/backup|\.broken$|\.before-selector$/i.test(entry.name))continue;
 const from=join(source,entry.name),to=join(target,entry.name);if(entry.isDirectory())copy(from,to);else copyFileSync(from,to);
}}
copy('public',destination);
console.log('Frontend deployment artifact prepared; backups excluded.');
