import {statSync,readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';

const path=process.argv[2];
if(!path)throw new Error('Usage: node scripts/verify-d1-backup.mjs /absolute/path/to/backup.sql');
const size=statSync(path).size;
if(size<1||size>100*1024*1024)throw new Error('Backup must be non-empty and smaller than 100 MB for this local validation.');
const db=new DatabaseSync(':memory:');
db.exec(readFileSync(path,'utf8'));
const integrity=db.prepare('PRAGMA integrity_check').get()?.integrity_check;
const tables=Number(db.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").get()?.n||0);
if(integrity!=='ok'||tables<1)throw new Error('Backup import or integrity check failed.');
console.log(JSON.stringify({integrity,tables,sizeBytes:size,restoreTest:'isolated in-memory SQLite'}));
db.close();
