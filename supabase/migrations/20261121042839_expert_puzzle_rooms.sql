alter table public.bsb_game_challenges
  drop constraint bsb_game_challenges_difficulty_check,
  add constraint bsb_game_challenges_difficulty_check
  check (
    difficulty in ('All', 'Easy', 'Medium', 'Hard')
    or (game_type in ('word-search', 'crossword') and difficulty = 'Expert')
  );
