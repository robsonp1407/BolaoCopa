import type { PrismaClient } from "@prisma/client";

import { createAuditLog } from "./audit";
import { recalculateTournamentInTransaction } from "./recalculate-tournament";
import type { MatchResultInput } from "./types";

type RegisterResultInput = MatchResultInput & {
  matchId: string;
  userId: string;
};

export async function registerMatchResult(
  prisma: PrismaClient,
  input: RegisterResultInput
) {
  return prisma.$transaction(
    async (tx) => {
      const match = await tx.match.update({
        where: { id: input.matchId },
        data: {
          homeScore: input.homeScore,
          awayScore: input.awayScore,
          homePenaltyScore: input.homePenaltyScore ?? null,
          awayPenaltyScore: input.awayPenaltyScore ?? null,
          status:
            input.homeScore === null || input.awayScore === null
              ? "SCHEDULED"
              : "FINISHED"
        }
      });

      const summary = await recalculateTournamentInTransaction(tx);

      await createAuditLog(tx, {
        action: "MATCH_RESULT_REGISTERED",
        entity: "Match",
        entityId: match.id,
        userId: input.userId,
        metadata: {
          matchNumber: match.matchNumber,
          homeScore: input.homeScore,
          awayScore: input.awayScore,
          homePenaltyScore: input.homePenaltyScore ?? null,
          awayPenaltyScore: input.awayPenaltyScore ?? null,
          recalculation: summary
        }
      });

      return { match, summary };
    },
    {
      maxWait: 10000,
      timeout: 60000
    }
  );
}
