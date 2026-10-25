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
 const safety=read('supabase/migrations/20261011024750_social_safety.sql');
 assert.ok(schema.includes(safety),'Cumulative schema must include safety migration');
 schema=schema.split('-- Social safety migration 20261011024750')[0];
 schema=schema.replace(/do \$\$[\s\S]*?\$\$;/g, block => block.includes('pg_publication_tables') ? '' : block);
 schema=schema.slice(0,schema.indexOf('create extension if not exists vector'))+schema.slice(schema.indexOf('create table if not exists public.bsb_push_subscriptions'));
 await db.exec(schema);
 await db.exec(safety);
 await db.exec(read("supabase/migrations/20261024161817_puzzle_game_challenges.sql"));
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

 for (const type of ['word-search','crossword','hidden-word']) {
  await login(a);
  const puzzle={type,words:['FAITH'],cells:[['F']],difficulty:'Medium',version:'BSB'};
  const create=()=>db.query(`select public.create_bsb_puzzle_room(array['${b}'::uuid],$1,'Mixed','Medium',5::smallint,'BSB',false,$2::jsonb) id`,[type,JSON.stringify(puzzle)]);
  const room=(await create()).rows[0].id;
  assert.deepEqual((await db.query(`select puzzle from public.bsb_game_challenges where id='${room}'`)).rows[0].puzzle,puzzle);
  await denied(`update public.bsb_game_challenge_players set puzzle_state='{"score":1}' where challenge_id='${room}' and user_id='${a}'`,'23514');
  await login(c);
  assert.equal((await db.query(`select * from public.bsb_game_challenges where id='${room}'`)).rows.length,0);
  await assert.rejects(create(), e=>e.code==='42501');
  await login(b);
  await db.query(`update public.bsb_game_challenge_players set invite_status='accepted',responded_at=now(),ready=true where challenge_id='${room}' and user_id='${b}'`);
  await db.query(`update public.bsb_game_challenge_players set ready=true where challenge_id='${room}' and user_id='${b}'`);
  await login(a);
  await db.query(`update public.bsb_game_challenge_players set ready=true where challenge_id='${room}' and user_id='${a}'`);
  await db.query(`select public.start_bsb_game_room('${room}')`);
  await db.query(`update public.bsb_game_challenge_players set score=1,progress=1,puzzle_state='{"foundWords":["FAITH"],"score":1}' where challenge_id='${room}' and user_id='${a}'`);
  await login(b);
  const restored=(await db.query(`select puzzle_state from public.bsb_game_challenge_players where challenge_id='${room}' and user_id='${a}'`)).rows[0].puzzle_state;
  assert.deepEqual(restored.foundWords,['FAITH']);
  await db.query(`update public.bsb_game_challenge_players set score=99 where challenge_id='${room}' and user_id='${a}'`);
  assert.equal((await db.query(`select score from public.bsb_game_challenge_players where challenge_id='${room}' and user_id='${a}'`)).rows[0].score,1);
  await db.query(`update public.bsb_game_challenge_players set score=1,progress=1,completed_at=now(),elapsed_ms=12000 where challenge_id='${room}' and user_id='${b}'`);
  await login(a);
  await db.query(`update public.bsb_game_challenge_players set completed_at=now(),elapsed_ms=10000 where challenge_id='${room}' and user_id='${a}'`);
  assert.equal((await db.query(`select status from public.bsb_game_challenges where id='${room}'`)).rows[0].status,'completed');
 }
 console.log('Puzzle challenge PostgreSQL room, RLS, progress, and completion tests passed');
} finally { await db.close(); }
