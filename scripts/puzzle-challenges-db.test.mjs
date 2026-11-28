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
 const rematches=read("supabase/migrations/20261121031016_game_room_rematches.sql");
 assert.ok(read('supabase/schema.sql').includes(rematches));
 await db.exec(rematches);
 const rosterMigration = read('supabase/migrations/20261121040551_game_room_roster.sql');
 assert.ok(read('supabase/schema.sql').includes(rosterMigration));
 await db.exec(rosterMigration);
 const closureMigration = read('supabase/migrations/20261121041432_game_room_closure_notices.sql');
 assert.ok(read('supabase/schema.sql').includes(closureMigration));
 await db.exec(closureMigration);
 const departureMigration = read('supabase/migrations/20261121042039_live_challenge_departures.sql');
 assert.ok(read('supabase/schema.sql').includes(departureMigration));
 await db.exec(departureMigration);
 const expertMigration = read('supabase/migrations/20261121042839_expert_puzzle_rooms.sql');
 assert.ok(read('supabase/schema.sql').includes(expertMigration));
 await db.exec(expertMigration);
 const rematchWaitingMigration = read('supabase/migrations/20261128020635_game_rematch_waiting_rooms.sql');
 assert.ok(read('supabase/schema.sql').includes(rematchWaitingMigration));
 await db.exec(rematchWaitingMigration);
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
 await db.query(`insert into public.bsb_friendships(requester_id,addressee_id) values('${a}','${c}')`);
 await login(c);
 await db.query(`update public.bsb_friendships set status='accepted',responded_at=now() where requester_id='${a}' and addressee_id='${c}'`);

 await login(a);
 const { rows: [{ id: rosterRoom }] } = await db.query(`select public.create_bsb_game_room(
   array['${b}'::uuid], 'trivia', 'Mixed', 'All', 5::smallint, 'BSB', false) as id`);
 const changeRoster = (player, action) => db.query(
   'select public.update_bsb_game_room_roster($1, $2, $3)', [rosterRoom, player, action]);
 await login(b);
 await assert.rejects(changeRoster(c, 'invite'), { code: '42501' });
 await db.query(`update public.bsb_game_challenge_players set invite_status='accepted', ready=true
   where challenge_id='${rosterRoom}' and user_id='${b}'`);
 await login(a);
 await assert.rejects(changeRoster(a, 'remove'), { code: '42501' });
 await changeRoster(c, 'invite');
 await changeRoster(c, 'invite');
 assert.equal((await db.query(`select max_players from public.bsb_game_challenges where id='${rosterRoom}'`)).rows[0].max_players, 3);
 await changeRoster(b, 'remove');
 await login(b);
 assert.equal((await db.query(`select id from public.bsb_game_challenges where id='${rosterRoom}'`)).rows.length, 0);
 await login(a);
 await changeRoster(b, 'invite');
 await login(b);
 assert.deepEqual((await db.query(`select invite_status, ready from public.bsb_game_challenge_players
   where challenge_id='${rosterRoom}' and user_id='${b}'`)).rows, [{ invite_status: 'invited', ready: false }]);
 await db.query(`update public.bsb_game_challenge_players set invite_status='accepted', ready=true
   where challenge_id='${rosterRoom}' and user_id='${b}'`);
 await login(a);
 await db.query(`select public.start_bsb_game_room('${rosterRoom}')`);
 await assert.rejects(changeRoster(b, 'remove'), { code: '23514' });
 await assert.rejects(changeRoster(c, 'invite'), { code: '23514' });

 for (const roomId of [rosterRoom, (await db.query(`select public.create_bsb_game_room(
   array['${b}'::uuid], 'trivia', 'Mixed', 'All', 5::smallint, 'BSB', false) as id`)).rows[0].id]) {
  const close = await db.query(`update public.bsb_game_challenges set status='cancelled', responded_at=now()
    where id='${roomId}' returning status`);
  assert.deepEqual(close.rows, [{ status: 'cancelled' }]);
  await login(b);
  assert.deepEqual((await db.query(`select status from public.bsb_game_challenges where id='${roomId}'`)).rows, [{ status: 'cancelled' }]);
  assert.equal((await db.query(`select user_id from public.bsb_game_challenge_players where challenge_id='${roomId}'`)).rows.length, 0);
  await login(a);
 }
 // A friend who was never invited cannot read a cancelled room.
 const { rows: [{ id: privateRoom }] } = await db.query(`select public.create_bsb_game_room(
   array['${b}'::uuid], 'trivia', 'Mixed', 'All', 5::smallint, 'BSB', false) as id`);
 await db.query(`update public.bsb_game_challenges set status='cancelled', responded_at=now() where id='${privateRoom}'`);
 await login(c);
 assert.equal((await db.query(`select status from public.bsb_game_challenges where id='${privateRoom}'`)).rows.length, 0);

 const createLiveRoom = async (guests) => {
  await login(a);
  const { rows: [{ id }] } = await db.query(`select public.create_bsb_game_room(
    $1::uuid[], 'trivia', 'Mixed', 'All', 5::smallint, 'BSB', false) as id`, [guests]);
  for (const guest of guests) {
   await login(guest);
   await db.query(`update public.bsb_game_challenge_players set invite_status='accepted', ready=true
     where challenge_id=$1 and user_id=$2`, [id, guest]);
  }
  await login(a);
  await db.query('select public.start_bsb_game_room($1)', [id]);
  return id;
 };
 const exitRoom = (id, endForEveryone = false) =>
   db.query('select public.exit_bsb_game_room($1, $2)', [id, endForEveryone]);
 const roomStatus = async (id) =>
   (await db.query('select status from public.bsb_game_challenges where id=$1', [id])).rows[0]?.status;

 const hostEnds = await createLiveRoom([b]);
 await exitRoom(hostEnds, true);
 await login(b);
 assert.equal(await roomStatus(hostEnds), 'cancelled');

 const guestLeaves = await createLiveRoom([b]);
 await login(b);
 await assert.rejects(exitRoom(guestLeaves, true), { code: '42501' });
 await exitRoom(guestLeaves);
 await exitRoom(guestLeaves);
 assert.equal(await roomStatus(guestLeaves), undefined);
 await login(a);
 assert.equal(await roomStatus(guestLeaves), 'accepted');
 assert.deepEqual((await db.query(`select invite_status from public.bsb_game_challenge_players
   where challenge_id=$1 and user_id=$2`, [guestLeaves, b])).rows, [{ invite_status: 'left' }]);
 await db.query(`update public.bsb_game_challenge_players set completed_at=now()
   where challenge_id=$1 and user_id=$2`, [guestLeaves, a]);
 assert.equal(await roomStatus(guestLeaves), 'completed');

 const hostLeaves = await createLiveRoom([b]);
 await exitRoom(hostLeaves);
 await login(b);
 assert.equal(await roomStatus(hostLeaves), 'accepted');
 await exitRoom(hostLeaves, true);
 assert.equal(await roomStatus(hostLeaves), 'cancelled');

 const groupGame = await createLiveRoom([b, c]);
 await exitRoom(groupGame);
 await login(b);
 assert.equal(await roomStatus(groupGame), 'accepted');
 await assert.rejects(exitRoom(groupGame, true), { code: '42501' });
 await db.query(`update public.bsb_game_challenge_players set completed_at=now()
   where challenge_id=$1 and user_id=$2`, [groupGame, b]);
 await login(c);
 assert.equal(await roomStatus(groupGame), 'accepted');
 await exitRoom(groupGame);
 await login(b);
 assert.equal(await roomStatus(groupGame), 'completed');

 for (const type of ['word-search','crossword','hidden-word']) {
  await login(a);
  const difficulty = type === 'hidden-word' ? 'Medium' : 'Expert';
  const puzzle={type,words:['FAITH'],cells:[['F']],difficulty,version:'BSB'};
  const invitees = type === 'hidden-word' ? [b, c] : [b];
  const create=()=>db.query(`select public.create_bsb_puzzle_room($3::uuid[],$1,'Mixed',$4,5::smallint,'BSB',false,$2::jsonb) id`,[type,JSON.stringify(puzzle),invitees,difficulty]);
  const room=(await create()).rows[0].id;
  assert.deepEqual((await db.query(`select puzzle, difficulty from public.bsb_game_challenges where id='${room}'`)).rows[0], { puzzle, difficulty });
  await denied(`update public.bsb_game_challenge_players set puzzle_state='{"score":1}' where challenge_id='${room}' and user_id='${a}'`,'23514');
  await login(c);
  if (invitees.includes(c)) {
   await db.query(`update public.bsb_game_challenge_players set invite_status='accepted', ready=true where challenge_id='${room}' and user_id='${c}'`);
  } else {
   assert.equal((await db.query(`select * from public.bsb_game_challenges where id='${room}'`)).rows.length,0);
  }
  await assert.rejects(create(), e=>e.code==='42501');
  await login(b);
  await db.query(`update public.bsb_game_challenge_players set invite_status='accepted',responded_at=now(),ready=true where challenge_id='${room}' and user_id='${b}'`);
  assert.equal((await db.query(`select ready from public.bsb_game_challenge_players where challenge_id='${room}' and user_id='${b}'`)).rows[0].ready, true);
  await denied(`select public.rematch_bsb_game_room('${room}')`,'23514');
  await denied(`select public.start_bsb_game_room('${room}')`,'42501');
  await login(a);
  await db.query(`select public.start_bsb_game_room('${room}')`);
  await db.query(`update public.bsb_game_challenge_players set score=1,progress=1,puzzle_state='{"foundWords":["FAITH"],"score":1}' where challenge_id='${room}' and user_id='${a}'`);
  await login(b);
  const restored=(await db.query(`select puzzle_state from public.bsb_game_challenge_players where challenge_id='${room}' and user_id='${a}'`)).rows[0].puzzle_state;
  assert.deepEqual(restored.foundWords,['FAITH']);
  await db.query(`update public.bsb_game_challenge_players set score=99 where challenge_id='${room}' and user_id='${a}'`);
  assert.equal((await db.query(`select score from public.bsb_game_challenge_players where challenge_id='${room}' and user_id='${a}'`)).rows[0].score,1);
  await db.query(`update public.bsb_game_challenge_players set score=1,progress=1,completed_at=now(),elapsed_ms=12000 where challenge_id='${room}' and user_id='${b}'`);
  if (invitees.includes(c)) {
   await login(c);
   await db.query(`update public.bsb_game_challenge_players set completed_at=now(),elapsed_ms=14000 where challenge_id='${room}' and user_id='${c}'`);
  }
  await login(a);
  await db.query(`update public.bsb_game_challenge_players set completed_at=now(),elapsed_ms=10000 where challenge_id='${room}' and user_id='${a}'`);
  assert.equal((await db.query(`select status from public.bsb_game_challenges where id='${room}'`)).rows[0].status,'completed');
  if (!invitees.includes(c)) {
   await login(c);
   await denied(`select public.rematch_bsb_game_room('${room}')`,'42501');
  }
  await login(b);
  const cancelledRematch = (await db.query(`select public.rematch_bsb_game_room('${room}') as id`)).rows[0].id;
  await db.query(`select public.exit_bsb_game_room('${cancelledRematch}', true)`);
  const rematch = (await db.query(`select public.rematch_bsb_game_room('${room}') as id`)).rows[0].id;
  assert.notEqual(rematch, cancelledRematch);
  assert.notEqual(rematch, room);
  const { rows: [replay] } = await db.query(`select status, started_at, rematch_of, puzzle,
    seed = (select seed from public.bsb_game_challenges where id='${room}') as same_seed
    from public.bsb_game_challenges where id='${rematch}'`);
  assert.equal(replay.status, 'pending');
  assert.equal(replay.started_at, null);
  assert.equal(replay.rematch_of, room);
  assert.deepEqual(replay.puzzle, puzzle);
  assert.equal(replay.same_seed, true);
  await login(a);
  assert.equal((await db.query(`select public.rematch_bsb_game_room('${room}') as id`)).rows[0].id, rematch);
  const { rows: replayPlayers } = await db.query(`select is_host, invite_status, ready, score, progress, completed_at, puzzle_state
    from public.bsb_game_challenge_players where challenge_id='${rematch}'`);
  assert.equal(replayPlayers.length, invitees.length + 1);
  for (const player of replayPlayers) {
   assert.deepEqual(player, {
    is_host: player.is_host, invite_status: player.is_host ? 'accepted' : 'invited',
    ready: false, score: 0, progress: 0, completed_at: null, puzzle_state: null,
   });
  }
  await denied(`select public.start_bsb_game_room('${rematch}')`,'42501');
  await login(b);
  await denied(`select public.start_bsb_game_room('${rematch}')`,'23514');
  await login(a);
  await db.query(`update public.bsb_game_challenge_players set invite_status='accepted', ready=true where challenge_id='${rematch}' and user_id='${a}'`);
  if (invitees.includes(c)) {
   await login(b);
   await denied(`select public.start_bsb_game_room('${rematch}')`,'23514');
   await login(c);
   await db.query(`update public.bsb_game_challenge_players set invite_status='accepted', ready=true where challenge_id='${rematch}' and user_id='${c}'`);
  }
  await login(b);
  assert.equal((await db.query(`select status from public.bsb_game_challenges where id='${rematch}'`)).rows[0].status, 'pending');
  await db.query(`select public.start_bsb_game_room('${rematch}')`);
  const startedRematch = (await db.query(`select status, started_at from public.bsb_game_challenges where id='${rematch}'`)).rows[0];
  assert.equal(startedRematch.status, 'accepted');
  assert.ok(startedRematch.started_at);
  assert.equal((await db.query(`select status from public.bsb_game_challenges where id='${room}'`)).rows[0].status,'completed');
 }
 console.log('Puzzle challenge PostgreSQL room, RLS, progress, and completion tests passed');
} finally { await db.close(); }
