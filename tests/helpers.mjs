import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import worker from '../worker/index.js';
export function fixture() {
  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY,role TEXT,username TEXT,email TEXT,password TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,avatar TEXT,bio TEXT,social_media TEXT,equipment TEXT,favorite_airlines TEXT,favorite_airports TEXT);
    CREATE TABLE flights(id INTEGER PRIMARY KEY,user_id INTEGER,status TEXT,reviewer_id INTEGER,reject_reason TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,airline TEXT,flight TEXT,route TEXT,date TEXT,aircraft TEXT,airport TEXT,image TEXT,story TEXT);
    CREATE TABLE favorites(id INTEGER PRIMARY KEY,user_id INTEGER,flight_id INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE appeals(id INTEGER PRIMARY KEY,user_id INTEGER,flight_id INTEGER,reason TEXT,status TEXT DEFAULT 'pending',created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    INSERT INTO users(id,role,username,email) VALUES(1,'superadministrator','SA','sa@example.test'),(2,'administrator','Admin','a@example.test'),(3,'user','User','u@example.test'),(4,'superadministrator','Invalid SA','i@example.test'),(5,'administrator','Other admin','b@example.test');
    INSERT INTO flights(id,user_id,status,reviewer_id,reject_reason) VALUES(10,1,'pending',2,NULL),(11,3,'hidden',1,'old reason'),(12,3,'pending',5,NULL),(13,3,'approved',2,NULL);
    CREATE TABLE admin_requests(id INTEGER PRIMARY KEY,user_id INTEGER,reason TEXT,social TEXT,status TEXT DEFAULT 'pending');`);
  db.exec(`CREATE TABLE community_posts(id INTEGER PRIMARY KEY,user_id INTEGER,title TEXT,content TEXT,status TEXT DEFAULT 'visible',created_at TEXT DEFAULT CURRENT_TIMESTAMP,moderation_reason TEXT);
    CREATE TABLE community_likes(id INTEGER PRIMARY KEY,post_id INTEGER,user_id INTEGER);
    CREATE TABLE community_comments(id INTEGER PRIMARY KEY,post_id INTEGER,user_id INTEGER,content TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);`);
  for(const file of ['0003_security.sql','0004_progress_community.sql','0005_moderation_appeals.sql','0006_password_reset_required.sql','0007_sa_security.sql','0008_account_deletion_requests.sql','0009_self_service_account_deletion.sql','0010_user_passkeys.sql','0011_oauth_identities.sql','0012_oauth_authorization_context.sql','0013_github_oauth.sql']) db.exec(readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8'));
  for(const id of [1,2,3,4,5]) db.prepare("INSERT INTO auth_sessions VALUES(?,?,datetime('now','+1 day'))").run(createHash('sha256').update(String(id).repeat(64)).digest('hex'),id);
  const env = { TURNSTILE_TEST_BYPASS:true, SA_SECURITY_TEST_BYPASS:true, DB: { async batch(statements) { db.exec('BEGIN'); try {const results=[];for(const stmt of statements) results.push(await stmt.run());db.exec('COMMIT');return results;}catch(e){db.exec('ROLLBACK');throw e;} }, prepare(sql) {
    let args = [];
    return { bind(...values) { args=values; return this; }, async first() { return db.prepare(sql).get(...args) || null; }, async all() { return { results: db.prepare(sql).all(...args) }; }, async run() { const result=db.prepare(sql).run(...args); return { meta: {...result,last_row_id:Number(result.lastInsertRowid)} }; } };
  } } };
  const call = (path, body, identity) => {
    const query=new URL(`https://test.invalid${path}`).searchParams;
    const id=identity??body?.sa_id??body?.admin_id??body?.user_id??query.get('sa_id')??query.get('admin_id')??query.get('user_id')??3;
    return worker.fetch(new Request(`https://test.invalid${path}`, {method:body?'POST':'GET',headers:{'Content-Type':'application/json',Cookie:`bpm_session=${String(id).repeat(64)}`},...(body?{body:JSON.stringify(body)}:{})}), env);
  };
  return {db,call,env,worker};
}
