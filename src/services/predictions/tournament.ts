export const WORLD_CUP_2026_TOURNAMENT_ID = "world-cup-2026";

export function poolAcceptsOfficialWorldCup(poolTournamentId?: string | null) {
  return (
    !poolTournamentId || poolTournamentId === WORLD_CUP_2026_TOURNAMENT_ID
  );
}
