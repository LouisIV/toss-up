import { generateBracket, advanceWinner, findMatchInBracket, getTournamentWinner } from '../tournament';

// Mock team data
const mockTeams = [
  { id: 'team1', name: 'Team 1', player1: 'Player 1', player2: 'Player 2' },
  { id: 'team2', name: 'Team 2', player1: 'Player 3', player2: 'Player 4' },
  { id: 'team3', name: 'Team 3', player1: 'Player 5', player2: 'Player 6' },
  { id: 'team4', name: 'Team 4', player1: 'Player 7', player2: 'Player 8' },
  { id: 'team5', name: 'Team 5', player1: 'Player 9', player2: 'Player 10' },
];

describe('Tournament Logic', () => {
  describe('generateBracket', () => {
    it('should generate bracket for even number of teams', () => {
      const teams = mockTeams.slice(0, 4); // 4 teams
      const bracket = generateBracket(teams);
      
      expect(bracket.rounds).toHaveLength(2); // Round 1 and Final
      expect(bracket.rounds[0].round).toBe(1);
      expect(bracket.rounds[0].matches).toHaveLength(2); // 2 matches in first round
      expect(bracket.rounds[1].round).toBe(2);
      expect(bracket.rounds[1].matches).toHaveLength(1); // 1 match in final
    });

    it('should generate bye determination round for odd number of teams', () => {
      const teams = mockTeams.slice(0, 5); // 5 teams
      const bracket = generateBracket(teams);
      
      expect(bracket.rounds).toHaveLength(3); // Round 0, Round 1, and Final
      expect(bracket.rounds[0].round).toBe(0); // Bye determination round
      expect(bracket.rounds[0].matches).toHaveLength(3); // 2 regular matches + 1 bye match
      expect(bracket.rounds[1].round).toBe(1); // Main tournament round
      expect(bracket.rounds[1].matches).toHaveLength(2); // 2 matches in main round
      expect(bracket.rounds[2].round).toBe(2); // Final
      expect(bracket.rounds[2].matches).toHaveLength(1); // 1 match in final
    });

    it('should place bye team in first match of main tournament', () => {
      const teams = mockTeams.slice(0, 5); // 5 teams
      const bracket = generateBracket(teams);
      
      const byeMatch = bracket.rounds[0].matches.find(match => 
        match.team1Id === 'team5' && !match.team2Id
      );
      expect(byeMatch).toBeDefined();
      expect(byeMatch?.winnerId).toBe('team5'); // Auto-advance the bye team
      
      // Check that bye team is placed in first match of Round 1
      const mainRoundFirstMatch = bracket.rounds[1].matches[0];
      expect(mainRoundFirstMatch.team1Id).toBe('team5');
      expect(mainRoundFirstMatch.team2Id).toBeUndefined(); // Waiting for opponent
    });

    it('should handle minimum teams requirement', () => {
      const singleTeam = mockTeams.slice(0, 1);
      const bracket = generateBracket(singleTeam);
      
      expect(bracket.rounds).toHaveLength(0);
    });
  });

  describe('advanceWinner', () => {
    it('should advance winner from bye determination round to main tournament', () => {
      const teams = mockTeams.slice(0, 5); // 5 teams
      const bracket = generateBracket(teams);
      
      // Advance winner from first bye determination match
      const updatedBracket = advanceWinner(bracket, 'bye-match-0', 'team1');
      
      // Check that team1 advanced to Round 1
      const round1Match = updatedBracket.rounds[1].matches.find(match => 
        match.team2Id === 'team1'
      );
      expect(round1Match).toBeDefined();
      expect(round1Match?.team1Id).toBe('team5'); // Bye team should be team1
      expect(round1Match?.team2Id).toBe('team1'); // Winner should be team2
    });

    it('should advance winner from main tournament to final', () => {
      const teams = mockTeams.slice(0, 4); // 4 teams (even)
      const bracket = generateBracket(teams);
      
      // Advance winner from first match
      const updatedBracket = advanceWinner(bracket, 'match-1-0', 'team1');
      
      // Check that team1 advanced to final
      const finalMatch = updatedBracket.rounds[1].matches[0];
      expect(finalMatch.team1Id).toBe('team1');
    });

    it('should handle bye team advancement correctly', () => {
      const teams = mockTeams.slice(0, 5); // 5 teams
      const bracket = generateBracket(teams);
      
      // The bye team should already be advanced in Round 0
      const byeMatch = bracket.rounds[0].matches.find(match => 
        match.team1Id === 'team5' && !match.team2Id
      );
      expect(byeMatch?.winnerId).toBe('team5');
      
      // Advance the bye team (this should work normally)
      const updatedBracket = advanceWinner(bracket, 'bye-match-2', 'team5');
      
      // The bye team should still be in the first match of Round 1
      const round1FirstMatch = updatedBracket.rounds[1].matches[0];
      expect(round1FirstMatch.team1Id).toBe('team5');
    });
  });

  describe('findMatchInBracket', () => {
    it('should find match by ID', () => {
      const teams = mockTeams.slice(0, 4);
      const bracket = generateBracket(teams);
      
      const match = findMatchInBracket(bracket, 'match-1-0');
      expect(match).toBeDefined();
      expect(match?.id).toBe('match-1-0');
      expect(match?.round).toBe(1);
    });

    it('should return null for non-existent match', () => {
      const teams = mockTeams.slice(0, 4);
      const bracket = generateBracket(teams);
      
      const match = findMatchInBracket(bracket, 'non-existent');
      expect(match).toBeNull();
    });
  });

  describe('getTournamentWinner', () => {
    it('should return winner of final match', () => {
      const teams = mockTeams.slice(0, 4);
      const bracket = generateBracket(teams);
      
      // Advance to final and set winner
      let updatedBracket = advanceWinner(bracket, 'match-1-0', 'team1');
      updatedBracket = advanceWinner(updatedBracket, 'match-1-1', 'team3');
      updatedBracket = advanceWinner(updatedBracket, 'match-2-0', 'team1');
      
      const winner = getTournamentWinner(updatedBracket);
      expect(winner).toBe('team1');
    });

    it('should return null if no winner set', () => {
      const teams = mockTeams.slice(0, 4);
      const bracket = generateBracket(teams);
      
      const winner = getTournamentWinner(bracket);
      expect(winner).toBeNull();
    });
  });

  describe('Integration Tests', () => {
    it('should complete a full 5-team tournament with bye determination', () => {
      const teams = mockTeams.slice(0, 5); // 5 teams
      let bracket = generateBracket(teams);
      
      // Round 0: Bye determination
      bracket = advanceWinner(bracket, 'bye-match-0', 'team1'); // team1 beats team2
      bracket = advanceWinner(bracket, 'bye-match-1', 'team3'); // team3 beats team4
      // team5 (bye) auto-advances
      
      // Round 1: Main tournament
      bracket = advanceWinner(bracket, 'match-1-0', 'team1'); // team1 beats team5 (bye)
      bracket = advanceWinner(bracket, 'match-1-1', 'team3'); // team3 advances (no opponent yet)
      
      // Final
      bracket = advanceWinner(bracket, 'match-2-0', 'team1'); // team1 wins final
      
      const winner = getTournamentWinner(bracket);
      expect(winner).toBe('team1');
    });

    it('should complete a full 4-team tournament', () => {
      const teams = mockTeams.slice(0, 4); // 4 teams
      let bracket = generateBracket(teams);
      
      // Round 1
      bracket = advanceWinner(bracket, 'match-1-0', 'team1'); // team1 beats team2
      bracket = advanceWinner(bracket, 'match-1-1', 'team3'); // team3 beats team4
      
      // Final
      bracket = advanceWinner(bracket, 'match-2-0', 'team1'); // team1 beats team3
      
      const winner = getTournamentWinner(bracket);
      expect(winner).toBe('team1');
    });
  });
});
