-- Run this once in the Supabase SQL Editor for projects that created
-- bsb_profiles before the expanded avatar choices were added.
--
-- This changes only the allowed avatar_key values. It does not modify
-- existing profile rows.

begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

alter table public.bsb_profiles
  drop constraint if exists bsb_profiles_avatar_key_check;

alter table public.bsb_profiles
  add constraint bsb_profiles_avatar_key_check
  check (avatar_key in (
    'initials',
    'book',
    'sun',
    'flame',
    'bookmark',
    'quote',
    'cross',
    'heart',
    'star',
    'dove',
    'fish',
    'mountain',
    'leaf',
    'crown',
    'compass',
    'moon'
  ));

commit;

select pg_get_constraintdef(oid) as avatar_key_constraint
from pg_constraint
where conrelid = 'public.bsb_profiles'::regclass
  and conname = 'bsb_profiles_avatar_key_check';
