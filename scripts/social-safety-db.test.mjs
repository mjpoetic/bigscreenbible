import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
// Real PostgreSQL RLS and triggers in memory. Only Auth/Realtime platform stubs;
// unrelated vector search and publication registration are omitted.
const db = new PGlite();
const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const a='11111111-1111-4111-8111-111111111111';
const b='22222222-2222-4222-8222-222222222222';
const c='33333333-3333-4333-8333-333333333333';
const login=async id => { await db.exec(`reset role; select set_config('request.jwt.claim.sub','${id}',false); set role authenticated;`); };
const admin=async sql => { await db.exec('reset role'); return db.query(sql); };
const denied=async (sql, code) => { await assert.rejects(db.query(sql), error => !code || error.code===code); };
try {
 await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth; create schema realtime; create schema extensions;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;
 create table realtime.messages(extension text, private boolean); alter table realtime.messages enable row level security;
 create function realtime.topic() returns text language sql stable as $$select current_setting('realtime.topic',true)$$;`);
 let schema=read('supabase/schema.sql');
 const safety=read('supabase/migrations/20261011014213_social_safety.sql');
 assert.ok(schema.endsWith(safety),'Cumulative schema must match safety migration');
 schema=schema.split('-- Social safety migration 20261011014213')[0];
 schema=schema.replace(/do \$\$[\s\S]*?\$\$;/g, block => block.includes('pg_publication_tables') ? '' : block);
 schema=schema.slice(0,schema.indexOf('create extension if not exists vector'))+schema.slice(schema.indexOf('create table if not exists public.bsb_push_subscriptions'));
 await db.exec(schema);
 await db.exec(safety);
 await admin(`insert into auth.users values('${a}'),('${b}'),('${c}')`);
 await login(a);
 await denied(`insert into public.bsb_profiles(user_id,username) values('${a}','reader_a')`,'42501');
 await denied(`insert into public.bsb_social_consents(user_id,terms_version) values('${b}','2026-10-10')`,'42501');
 await denied(`insert into public.bsb_social_consents(user_id,terms_version,accepted_at) values('${a}','2026-10-10',now())`,'42501');
 for (const [id,name] of [[a,'reader_a'],[b,'reader_b'],[c,'reader_c']]) {
  await login(id);
  await db.query(`insert into public.bsb_social_consents(user_id,terms_version) values('${id}','2026-10-10')`);
  await db.query(`insert into public.bsb_profiles(user_id,username) values('${id}','${name}')`);
 }
 await login(a);
 await denied(`update public.bsb_profiles set display_name='fuck you' where user_id='${a}'`,'23514');
 await db.query(`insert into public.bsb_friendships(requester_id,addressee_id) values('${a}','${b}')`);
 await login(b);
 await db.query(`update public.bsb_friendships set status='accepted',responded_at=now() where requester_id='${a}' and addressee_id='${b}'`);
 await login(a);
 const room=(await db.query(`select public.create_bsb_game_room(array['${b}'::uuid],'trivia','Mixed','All',10::smallint,'BSB',false) id`)).rows[0].id;
 await db.query(`insert into public.bsb_social_reports(reporter_id,reported_id,reason,details) values('${a}','${b}','harassment','Threat in display name')`);
 await denied('select * from public.bsb_social_reports','42501');
 await denied(`insert into public.bsb_social_reports(reporter_id,reported_id,reason) values('${b}','${c}','spam')`,'42501');
 await denied(`insert into public.bsb_social_reports(reporter_id,reported_id,reason,status) values('${a}','${c}','spam','resolved')`,'42501');
 await denied(`insert into public.bsb_social_reports(reporter_id,reported_id,reason) values('${a}','${b}','spam')`,'23514');
 await db.query(`insert into public.bsb_user_blocks(blocker_id,blocked_id) values('${a}','${b}')`);
 assert.equal((await db.query(`select * from public.bsb_profiles where user_id='${b}'`)).rows.length,0);
 assert.equal((await db.query('select * from public.bsb_friendships')).rows.length,0);
 assert.equal((await db.query(`select * from public.bsb_game_challenges where id='${room}'`)).rows.length,0);
 await denied(`insert into public.bsb_friendships(requester_id,addressee_id) values('${a}','${b}')`,'42501');
 await denied(`select public.create_bsb_game_room(array['${b}'::uuid],'trivia','Mixed','All',10::smallint,'BSB',false)`,'42501');
 await login(b);
 assert.equal((await db.query('select * from public.bsb_user_blocks')).rows.length,0);
 assert.equal((await db.query(`select * from public.bsb_profiles where user_id='${a}'`)).rows.length,0);
 await denied(`insert into public.bsb_friendships(requester_id,addressee_id) values('${b}','${a}')`,'42501');
 await denied(`select public.start_bsb_game_room('${room}')`,'42501');
 await db.query(`delete from public.bsb_user_blocks where blocker_id='${a}'`);
 assert.equal((await admin(`select * from public.bsb_user_blocks`)).rows.length,1,'Other user cannot unblock');
 assert.equal((await admin(`select status from public.bsb_game_challenges where id='${room}'`)).rows[0].status,'cancelled');
 const report=(await admin('select * from public.bsb_social_reports')).rows[0];
 assert.equal(report.profile_snapshot.username,'reader_b');
 assert.equal(report.status,'open');
 await login(a);
 await db.query(`delete from public.bsb_user_blocks where blocker_id='${a}' and blocked_id='${b}'`);
 assert.equal((await db.query(`select * from public.bsb_profiles where user_id='${b}'`)).rows.length,1);
 assert.equal((await db.query('select * from public.bsb_friendships')).rows.length,0,'Unblock does not restore relationship');
 // Rejoin as three accepted friends, start a group room, then block mid-game.
 for (const target of [b,c]) {
  await login(a);
  await db.query(`insert into public.bsb_friendships(requester_id,addressee_id) values('${a}','${target}')`);
  await login(target);
  await db.query(`update public.bsb_friendships set status='accepted',responded_at=now() where requester_id='${a}' and addressee_id='${target}'`);
 }
 await login(a);
 const group=(await db.query(`select public.create_bsb_game_room(array['${b}'::uuid,'${c}'::uuid],'trivia','Mixed','All',10::smallint,'BSB',false) id`)).rows[0].id;
 for (const id of [b,c]) {
  await login(id);
  await db.query(`update public.bsb_game_challenge_players set invite_status='accepted' where challenge_id='${group}' and user_id='${id}'`);
 }
 for (const id of [a,b,c]) {
  await login(id);
  await db.query(`update public.bsb_game_challenge_players set ready=true where challenge_id='${group}' and user_id='${id}'`);
 }
 await login(a);
 await db.query(`select public.start_bsb_game_room('${group}')`);
 await db.query(`insert into public.bsb_user_blocks(blocker_id,blocked_id) values('${a}','${b}')`);
 assert.equal((await admin(`select status from public.bsb_game_challenges where id='${group}'`)).rows[0].status,'cancelled');
 await login(b);
 assert.equal((await db.query(`update public.bsb_game_challenge_players set progress=1 where challenge_id='${group}' and user_id='${b}' returning user_id`)).rows.length,0,'Blocked player cannot send further game progress');
 await denied(`select public.bsb_social_push_allowed('${a}','${b}')`,'42501');
 await db.exec('reset role; set role service_role');
 assert.equal((await db.query(`select public.bsb_social_push_allowed('${a}','${b}') allowed`)).rows[0].allowed,false);
 await login(a);
 await db.query(`delete from public.bsb_user_blocks where blocker_id='${a}' and blocked_id='${b}'`);
 // Moderator suspension also cancels an existing pending room.
 await db.query(`insert into public.bsb_friendships(requester_id,addressee_id) values('${a}','${b}')`);
 await login(b);
 await db.query(`update public.bsb_friendships set status='accepted',responded_at=now() where requester_id='${a}' and addressee_id='${b}'`);
 await login(a);
 const suspendedRoom=(await db.query(`select public.create_bsb_game_room(array['${b}'::uuid],'trivia','Mixed','All',10::smallint,'BSB',false) id`)).rows[0].id;
 await admin(`insert into private.bsb_social_suspensions(user_id,reason) values('${b}','Confirmed harassment')`);
 assert.equal((await admin(`select status from public.bsb_game_challenges where id='${suspendedRoom}'`)).rows[0].status,'cancelled');
 await login(b);
 await denied(`update public.bsb_profiles set display_name='New name' where user_id='${b}'`,'42501');
 await denied('select * from private.bsb_social_suspensions','42501');
 await login(a);
 assert.equal((await db.query(`select * from public.bsb_profiles where user_id='${b}'`)).rows.length,0);
 await denied(`insert into public.bsb_friendships(requester_id,addressee_id) values('${a}','${b}')`,'42501');
 await db.exec('reset role; set role anon');
 await denied('select * from public.bsb_user_blocks','42501');
 await denied('select * from public.bsb_social_consents','42501');
 console.log('Social safety PostgreSQL checks passed (consent, RLS, reports, blocks, rooms, suspension).');
} catch (error) { console.error(error.message, error.code); process.exitCode=1; }
finally {await db.close();}
