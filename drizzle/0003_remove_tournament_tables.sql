-- Drop foreign key constraints first
ALTER TABLE "matches" DROP CONSTRAINT IF EXISTS "matches_tournament_id_tournaments_id_fk";
ALTER TABLE "matches" DROP CONSTRAINT IF EXISTS "matches_team1_id_teams_id_fk";
ALTER TABLE "matches" DROP CONSTRAINT IF EXISTS "matches_team2_id_teams_id_fk";
ALTER TABLE "matches" DROP CONSTRAINT IF EXISTS "matches_winner_id_teams_id_fk";

-- Drop tables
DROP TABLE IF EXISTS "matches";
DROP TABLE IF EXISTS "tournaments";
