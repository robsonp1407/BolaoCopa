import { resolveQualifier, type QualifierContext } from "./resolve-qualifiers";

export type BracketMatchInput = {
  id: string;
  matchNumber: number;
  homeQualifier: string | null;
  awayQualifier: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
};

export type BracketMatchUpdate = {
  id: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
};

export function advanceBracket(
  matches: BracketMatchInput[],
  context: QualifierContext
): BracketMatchUpdate[] {
  return matches
    .filter((match) => match.homeQualifier || match.awayQualifier)
    .map((match) => ({
      id: match.id,
      homeTeamId: resolveQualifier(match.homeQualifier, context)?.id ?? null,
      awayTeamId: resolveQualifier(match.awayQualifier, context)?.id ?? null
    }))
    .filter(
      (update) =>
        matches.find((match) => match.id === update.id)?.homeTeamId !==
          update.homeTeamId ||
        matches.find((match) => match.id === update.id)?.awayTeamId !==
          update.awayTeamId
    );
}
