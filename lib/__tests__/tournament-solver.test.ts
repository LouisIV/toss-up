import { TournamentSolver } from '../tournament-solver';
import { Team } from '../db/schema';

// Mock teams for testing
const createMockTeam = (id: string, name: string): Team => ({
  id,
  name,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('TournamentSolver', () => {
  describe('Bracket Generation', () => {
    it('should generate bracket for 2 teams', () => {
      const teams = [
        createMockTeam('team1', 'Team 1'),
        createMockTeam('team2', 'Team 2'),
      ];
      
      const solver = new TournamentSolver(teams);
      const bracket = solver.getBracketData();
      
      expect(bracket.rounds).toHaveLength(1);
      expect(bracket.rounds[0].round).toBe(0);
      expect(bracket.rounds[0].matches).toHaveLength(1);
      expect(bracket.rounds[0].matches[0].id).toBe('match-0-0');
    });

    it('should generate bracket for 4 teams', () => {
      const teams = [
        createMockTeam('team1', 'Team 1'),
        createMockTeam('team2', 'Team 2'),
        createMockTeam('team3', 'Team 3'),
        createMockTeam('team4', 'Team 4'),
      ];
      
      const solver = new TournamentSolver(teams);
      const bracket = solver.getBracketData();
      
      expect(bracket.rounds).toHaveLength(2);
      expect(bracket.rounds[0].round).toBe(0);
      expect(bracket.rounds[0].matches).toHaveLength(2);
      expect(bracket.rounds[1].round).toBe(1);
      expect(bracket.rounds[1].matches).toHaveLength(1);
    });

    it('should generate bracket for 5 teams with bye determination', () => {
      const teams = [
        createMockTeam('team1', 'Team 1'),
        createMockTeam('team2', 'Team 2'),
        createMockTeam('team3', 'Team 3'),
        createMockTeam('team4', 'Team 4'),
        createMockTeam('team5', 'Team 5'),
      ];
      
      const solver = new TournamentSolver(teams);
      const bracket = solver.getBracketData();
      
      expect(bracket.rounds).toHaveLength(4); // Round 0 (bye), Round 1, Round 2, Final
      expect(bracket.rounds[0].round).toBe(0);
      expect(bracket.rounds[0].matches).toHaveLength(3); // 2 matches + 1 bye
      
      // Check that the bye team is auto-advanced
      const byeMatch = bracket.rounds[0].matches.find(m => !m.team2Id);
      expect(byeMatch).toBeDefined();
      expect(byeMatch?.winnerId).toBe('team5');
    });

    it('should assign table IDs correctly', () => {
      const teams = [
        createMockTeam('team1', 'Team 1'),
        createMockTeam('team2', 'Team 2'),
        createMockTeam('team3', 'Team 3'),
        createMockTeam('team4', 'Team 4'),
      ];
      
      const solver = new TournamentSolver(teams, 2); // 2 tables
      const bracket = solver.getBracketData();
      
      // Check that matches are distributed across tables
      const round0Matches = bracket.rounds[0].matches;
      expect(round0Matches[0].tableId).toBe(1);
      expect(round0Matches[1].tableId).toBe(2);
    });
  });

  describe('Match Processing', () => {
    it('should process match results and advance winners', () => {
      const teams = [
        createMockTeam('team1', 'Team 1'),
        createMockTeam('team2', 'Team 2'),
        createMockTeam('team3', 'Team 3'),
        createMockTeam('team4', 'Team 4'),
      ];
      
      const solver = new TournamentSolver(teams);
      
      // Process first match
      solver.processMatchResult('match-0-0', 'team1');
      
      const bracket = solver.getBracketData();
      const round0Match0 = bracket.rounds[0].matches[0];
      const round1Match0 = bracket.rounds[1].matches[0];
      
      expect(round0Match0.winnerId).toBe('team1');
      expect(round1Match0.team1Id).toBe('team1');
    });

    it('should handle bye team placement correctly', () => {
      const teams = [
        createMockTeam('team1', 'Team 1'),
        createMockTeam('team2', 'Team 2'),
        createMockTeam('team3', 'Team 3'),
        createMockTeam('team4', 'Team 4'),
        createMockTeam('team5', 'Team 5'), // This team gets a bye
      ];
      
      const solver = new TournamentSolver(teams);
      
      // Process Round 0 matches
      solver.processMatchResult('bye-match-0', 'team1'); // team1 beats team2
      solver.processMatchResult('bye-match-1', 'team3'); // team3 beats team4
      
      // Process Round 1 match
      solver.processMatchResult('match-1-0', 'team1'); // team1 beats team3
      
      const bracket = solver.getBracketData();
      const finalRound = bracket.rounds[bracket.rounds.length - 1];
      const finalMatch = finalRound.matches[0];
      
      // The bye team (team5) should be in the final
      expect(finalMatch.team1Id).toBe('team5');
      expect(finalMatch.winnerId).toBe('team5'); // Auto-advanced
    });

    it('should determine tournament winner correctly', () => {
      const teams = [
        createMockTeam('team1', 'Team 1'),
        createMockTeam('team2', 'Team 2'),
      ];
      
      const solver = new TournamentSolver(teams);
      
      // Process the final match
      solver.processMatchResult('match-0-0', 'team1');
      
      expect(solver.getTournamentWinner()).toBe('team1');
      expect(solver.isTournamentComplete()).toBe(true);
    });
  });

  describe('Active Matches', () => {
    it('should return active matches correctly', () => {
      const teams = [
        createMockTeam('team1', 'Team 1'),
        createMockTeam('team2', 'Team 2'),
        createMockTeam('team3', 'Team 3'),
        createMockTeam('team4', 'Team 4'),
      ];
      
      const solver = new TournamentSolver(teams);
      
      // Initially, only Round 0 matches should be active
      let activeMatches = solver.getActiveMatches();
      expect(activeMatches).toHaveLength(2);
      expect(activeMatches.every(m => m.round === 0)).toBe(true);
      
      // Process one match
      solver.processMatchResult('match-0-0', 'team1');
      
      // Now only one Round 0 match should be active
      activeMatches = solver.getActiveMatches();
      expect(activeMatches).toHaveLength(1);
      expect(activeMatches[0].id).toBe('match-0-1');
    });

    it('should handle bye matches correctly in active matches', () => {
      const teams = [
        createMockTeam('team1', 'Team 1'),
        createMockTeam('team2', 'Team 2'),
        createMockTeam('team3', 'Team 3'),
      ];
      
      const solver = new TournamentSolver(teams);
      
      // Initially, only the bye determination match should be active
      let activeMatches = solver.getActiveMatches();
      expect(activeMatches).toHaveLength(1);
      expect(activeMatches[0].id).toBe('bye-match-0');
      
      // Process the bye determination match
      solver.processMatchResult('bye-match-0', 'team1');
      
      // Now Round 1 should have an active match
      activeMatches = solver.getActiveMatches();
      expect(activeMatches).toHaveLength(1);
      expect(activeMatches[0].round).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single team gracefully', () => {
      const teams = [createMockTeam('team1', 'Team 1')];
      
      const solver = new TournamentSolver(teams);
      const bracket = solver.getBracketData();
      
      expect(bracket.rounds).toHaveLength(0);
      expect(solver.getTournamentWinner()).toBeNull();
    });

    it('should handle empty team list', () => {
      const teams: Team[] = [];
      
      const solver = new TournamentSolver(teams);
      const bracket = solver.getBracketData();
      
      expect(bracket.rounds).toHaveLength(0);
    });

    it('should throw error for invalid match ID', () => {
      const teams = [
        createMockTeam('team1', 'Team 1'),
        createMockTeam('team2', 'Team 2'),
      ];
      
      const solver = new TournamentSolver(teams);
      
      expect(() => {
        solver.processMatchResult('invalid-match-id', 'team1');
      }).toThrow('Match invalid-match-id not found');
    });
  });

  describe('Tournament Progression', () => {
    it('should correctly progress through a 5-team tournament', () => {
      const teams = [
        createMockTeam('team1', 'Team 1'),
        createMockTeam('team2', 'Team 2'),
        createMockTeam('team3', 'Team 3'),
        createMockTeam('team4', 'Team 4'),
        createMockTeam('team5', 'Team 5'),
      ];
      
      const solver = new TournamentSolver(teams);
      
      // Round 0: Bye determination
      solver.processMatchResult('bye-match-0', 'team1'); // team1 beats team2
      solver.processMatchResult('bye-match-1', 'team3'); // team3 beats team4
      // team5 gets bye automatically
      
      // Round 1: team1 vs team3
      solver.processMatchResult('match-1-0', 'team1'); // team1 beats team3
      
      // Round 2: team1 vs team5 (bye team)
      solver.processMatchResult('match-2-0', 'team1'); // team1 beats team5
      
      expect(solver.getTournamentWinner()).toBe('team1');
      expect(solver.isTournamentComplete()).toBe(true);
    });

    it('should handle 8-team tournament correctly', () => {
      const teams = Array.from({ length: 8 }, (_, i) => 
        createMockTeam(`team${i + 1}`, `Team ${i + 1}`)
      );
      
      const solver = new TournamentSolver(teams);
      const bracket = solver.getBracketData();
      
      expect(bracket.rounds).toHaveLength(3); // 3 rounds for 8 teams
      expect(bracket.rounds[0].matches).toHaveLength(4); // 4 matches in first round
      expect(bracket.rounds[1].matches).toHaveLength(2); // 2 matches in second round
      expect(bracket.rounds[2].matches).toHaveLength(1); // 1 match in final
    });
  });
});
