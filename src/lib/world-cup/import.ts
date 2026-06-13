import type { Prisma, PrismaClient } from "@prisma/client";
import { z } from "zod";

const confederationSchema = z.enum([
  "AFC",
  "CAF",
  "CONCACAF",
  "CONMEBOL",
  "OFC",
  "UEFA"
]);

const matchStatusSchema = z
  .enum(["SCHEDULED", "IN_PROGRESS", "FINISHED", "POSTPONED", "CANCELED"])
  .default("SCHEDULED");

const datetimeSchema = z.string().datetime({ offset: true });

export const worldCupSeedSchema = z.object({
  cities: z.array(
    z.object({
      slug: z.string().min(1),
      name: z.string().min(1),
      country: z.string().min(1),
      timezone: z.string().min(1)
    })
  ),
  stadiums: z.array(
    z.object({
      slug: z.string().min(1),
      name: z.string().min(1),
      citySlug: z.string().min(1),
      capacity: z.number().int().positive().optional()
    })
  ),
  groups: z.array(
    z.object({
      code: z.string().min(1),
      name: z.string().min(1),
      sortOrder: z.number().int().positive()
    })
  ),
  stages: z.array(
    z.object({
      code: z.string().min(1),
      name: z.string().min(1),
      sortOrder: z.number().int().positive(),
      isKnockout: z.boolean().default(false),
      startsAt: datetimeSchema.optional(),
      endsAt: datetimeSchema.optional(),
      expectedMatches: z.number().int().positive().optional()
    })
  ),
  teams: z
    .array(
      z.object({
        fifaCode: z.string().min(2).max(4),
        name: z.string().min(1),
        slug: z.string().min(1),
        flagEmoji: z.string().optional(),
        confederation: confederationSchema.optional(),
        groupCode: z.string().min(1).optional(),
        groupPosition: z.number().int().min(1).max(4).optional()
      })
    )
    .default([]),
  matches: z
    .array(
      z.object({
        matchNumber: z.number().int().positive(),
        stageCode: z.string().min(1),
        groupCode: z.string().min(1).optional(),
        stadiumSlug: z.string().min(1).optional(),
        homeTeamCode: z.string().min(2).max(4).optional(),
        awayTeamCode: z.string().min(2).max(4).optional(),
        homeSlot: z.string().min(1).optional(),
        awaySlot: z.string().min(1).optional(),
        homeQualifier: z.string().min(1).optional(),
        awayQualifier: z.string().min(1).optional(),
        startsAt: datetimeSchema.optional(),
        status: matchStatusSchema
      })
    )
    .default([])
});

export type WorldCupSeedInput = z.input<typeof worldCupSeedSchema>;
export type WorldCupSeed = z.output<typeof worldCupSeedSchema>;

export type WorldCupImportSummary = {
  cities: number;
  stadiums: number;
  groups: number;
  stages: number;
  teams: number;
  matches: number;
};

type TransactionClient = Prisma.TransactionClient;

export async function importWorldCupData(
  prisma: PrismaClient,
  input: unknown
): Promise<WorldCupImportSummary> {
  const seed = worldCupSeedSchema.parse(input);

  return prisma.$transaction(
    async (tx) => {
      await upsertCities(tx, seed);
      await upsertStadiums(tx, seed);
      await upsertGroups(tx, seed);
      await upsertStages(tx, seed);
      await upsertTeams(tx, seed);
      await upsertMatches(tx, seed);

      return {
        cities: seed.cities.length,
        stadiums: seed.stadiums.length,
        groups: seed.groups.length,
        stages: seed.stages.length,
        teams: seed.teams.length,
        matches: seed.matches.length
      };
    },
    {
      maxWait: 10000,
      timeout: 60000
    }
  );
}

async function upsertCities(tx: TransactionClient, seed: WorldCupSeed) {
  for (const city of seed.cities) {
    await tx.hostCity.upsert({
      where: { slug: city.slug },
      update: {
        name: city.name,
        country: city.country,
        timezone: city.timezone
      },
      create: city
    });
  }
}

async function upsertStadiums(tx: TransactionClient, seed: WorldCupSeed) {
  for (const stadium of seed.stadiums) {
    const city = await tx.hostCity.findUniqueOrThrow({
      where: { slug: stadium.citySlug },
      select: { id: true }
    });

    await tx.stadium.upsert({
      where: { slug: stadium.slug },
      update: {
        name: stadium.name,
        cityId: city.id,
        capacity: stadium.capacity
      },
      create: {
        slug: stadium.slug,
        name: stadium.name,
        cityId: city.id,
        capacity: stadium.capacity
      }
    });
  }
}

async function upsertGroups(tx: TransactionClient, seed: WorldCupSeed) {
  for (const group of seed.groups) {
    await tx.tournamentGroup.upsert({
      where: { code: group.code },
      update: {
        name: group.name,
        sortOrder: group.sortOrder
      },
      create: group
    });
  }
}

async function upsertStages(tx: TransactionClient, seed: WorldCupSeed) {
  for (const stage of seed.stages) {
    await tx.tournamentStage.upsert({
      where: { code: stage.code },
      update: {
        name: stage.name,
        sortOrder: stage.sortOrder,
        isKnockout: stage.isKnockout,
        startsAt: stage.startsAt ? new Date(stage.startsAt) : null,
        endsAt: stage.endsAt ? new Date(stage.endsAt) : null,
        expectedMatches: stage.expectedMatches
      },
      create: {
        code: stage.code,
        name: stage.name,
        sortOrder: stage.sortOrder,
        isKnockout: stage.isKnockout,
        startsAt: stage.startsAt ? new Date(stage.startsAt) : undefined,
        endsAt: stage.endsAt ? new Date(stage.endsAt) : undefined,
        expectedMatches: stage.expectedMatches
      }
    });
  }
}

async function upsertTeams(tx: TransactionClient, seed: WorldCupSeed) {
  for (const team of seed.teams) {
    const group = team.groupCode
      ? await tx.tournamentGroup.findUniqueOrThrow({
          where: { code: team.groupCode },
          select: { id: true }
        })
      : null;

    await tx.nationalTeam.upsert({
      where: { fifaCode: team.fifaCode },
      update: {
        name: team.name,
        slug: team.slug,
        flagEmoji: team.flagEmoji,
        confederation: team.confederation,
        groupId: group?.id ?? null,
        groupPosition: team.groupPosition
      },
      create: {
        fifaCode: team.fifaCode,
        name: team.name,
        slug: team.slug,
        flagEmoji: team.flagEmoji,
        confederation: team.confederation,
        groupId: group?.id,
        groupPosition: team.groupPosition
      }
    });
  }
}

async function upsertMatches(tx: TransactionClient, seed: WorldCupSeed) {
  for (const match of seed.matches) {
    const stage = await tx.tournamentStage.findUniqueOrThrow({
      where: { code: match.stageCode },
      select: { id: true }
    });
    const group = match.groupCode
      ? await tx.tournamentGroup.findUniqueOrThrow({
          where: { code: match.groupCode },
          select: { id: true }
        })
      : null;
    const stadium = match.stadiumSlug
      ? await tx.stadium.findUniqueOrThrow({
          where: { slug: match.stadiumSlug },
          select: { id: true }
        })
      : null;
    const homeTeam = match.homeTeamCode
      ? await tx.nationalTeam.findUniqueOrThrow({
          where: { fifaCode: match.homeTeamCode },
          select: { id: true }
        })
      : null;
    const awayTeam = match.awayTeamCode
      ? await tx.nationalTeam.findUniqueOrThrow({
          where: { fifaCode: match.awayTeamCode },
          select: { id: true }
        })
      : null;

    await tx.match.upsert({
      where: { matchNumber: match.matchNumber },
      update: {
        stageId: stage.id,
        groupId: group?.id ?? null,
        stadiumId: stadium?.id ?? null,
        homeTeamId: homeTeam?.id ?? null,
        awayTeamId: awayTeam?.id ?? null,
        homeSlot: match.homeSlot,
        awaySlot: match.awaySlot,
        homeQualifier: match.homeQualifier ?? match.homeSlot,
        awayQualifier: match.awayQualifier ?? match.awaySlot,
        startsAt: match.startsAt ? new Date(match.startsAt) : null,
        status: match.status
      },
      create: {
        matchNumber: match.matchNumber,
        stageId: stage.id,
        groupId: group?.id,
        stadiumId: stadium?.id,
        homeTeamId: homeTeam?.id,
        awayTeamId: awayTeam?.id,
        homeSlot: match.homeSlot,
        awaySlot: match.awaySlot,
        homeQualifier: match.homeQualifier ?? match.homeSlot,
        awayQualifier: match.awayQualifier ?? match.awaySlot,
        startsAt: match.startsAt ? new Date(match.startsAt) : undefined,
        status: match.status
      }
    });
  }
}
