import { describe, expect, it, vi } from "vitest";

import { importWorldCupData, worldCupSeedSchema } from "@/lib/world-cup/import";

type Store = {
  cityId?: string;
  stadiumId?: string;
  groupId?: string;
  stageId?: string;
  homeTeamId?: string;
  awayTeamId?: string;
};

function createPrismaMock() {
  const store: Store = {};
  const calls = {
    hostCity: 0,
    stadium: 0,
    tournamentGroup: 0,
    tournamentStage: 0,
    nationalTeam: 0,
    match: 0
  };

  const tx = {
    hostCity: {
      upsert: vi.fn(async () => {
        calls.hostCity += 1;
        store.cityId = "city-1";
      }),
      findUniqueOrThrow: vi.fn(async () => ({ id: store.cityId ?? "city-1" }))
    },
    stadium: {
      upsert: vi.fn(async () => {
        calls.stadium += 1;
        store.stadiumId = "stadium-1";
      }),
      findUniqueOrThrow: vi.fn(async () => ({ id: store.stadiumId ?? "stadium-1" }))
    },
    tournamentGroup: {
      upsert: vi.fn(async () => {
        calls.tournamentGroup += 1;
        store.groupId = "group-1";
      }),
      findUniqueOrThrow: vi.fn(async () => ({ id: store.groupId ?? "group-1" }))
    },
    tournamentStage: {
      upsert: vi.fn(async () => {
        calls.tournamentStage += 1;
        store.stageId = "stage-1";
      }),
      findUniqueOrThrow: vi.fn(async () => ({ id: store.stageId ?? "stage-1" }))
    },
    nationalTeam: {
      upsert: vi.fn(async ({ where }: { where: { fifaCode: string } }) => {
        calls.nationalTeam += 1;
        if (where.fifaCode === "BRA") {
          store.homeTeamId = "team-bra";
        }
        if (where.fifaCode === "JPN") {
          store.awayTeamId = "team-jpn";
        }
      }),
      findUniqueOrThrow: vi.fn(
        async ({ where }: { where: { fifaCode: string } }) => ({
          id: where.fifaCode === "BRA" ? "team-bra" : "team-jpn"
        })
      )
    },
    match: {
      upsert: vi.fn(async () => {
        calls.match += 1;
      })
    }
  };

  const prisma = {
    $transaction: vi.fn(async (callback) => callback(tx))
  };

  return { calls, prisma };
}

const seed = {
  cities: [
    {
      slug: "dallas",
      name: "Dallas",
      country: "Estados Unidos",
      timezone: "America/Chicago"
    }
  ],
  stadiums: [
    {
      slug: "dallas-stadium",
      name: "Dallas Stadium",
      citySlug: "dallas"
    }
  ],
  groups: [{ code: "A", name: "Grupo A", sortOrder: 1 }],
  stages: [
    {
      code: "GROUP_STAGE",
      name: "Fase de grupos",
      sortOrder: 1,
      expectedMatches: 72
    }
  ],
  teams: [
    {
      fifaCode: "BRA",
      name: "Brasil",
      slug: "brasil",
      confederation: "CONMEBOL",
      groupCode: "A",
      groupPosition: 1
    },
    {
      fifaCode: "JPN",
      name: "Japao",
      slug: "japao",
      confederation: "AFC",
      groupCode: "A",
      groupPosition: 2
    }
  ],
  matches: [
    {
      matchNumber: 1,
      stageCode: "GROUP_STAGE",
      groupCode: "A",
      stadiumSlug: "dallas-stadium",
      homeTeamCode: "BRA",
      awayTeamCode: "JPN",
      startsAt: "2026-06-11T13:00:00-06:00"
    }
  ]
};

describe("world cup import", () => {
  it("validates the seed structure", () => {
    const parsed = worldCupSeedSchema.parse(seed);

    expect(parsed.cities).toHaveLength(1);
    expect(parsed.matches[0]?.status).toBe("SCHEDULED");
    expect(parsed.matches[0]?.startsAt).toBe("2026-06-11T13:00:00-06:00");
  });

  it("imports entities in a single transaction", async () => {
    const { calls, prisma } = createPrismaMock();

    const summary = await importWorldCupData(
      // The importer only needs the Prisma delegate methods mocked here.
      prisma as never,
      seed
    );

    expect(summary).toEqual({
      cities: 1,
      stadiums: 1,
      groups: 1,
      stages: 1,
      teams: 2,
      matches: 1
    });
    expect(calls).toEqual({
      hostCity: 1,
      stadium: 1,
      tournamentGroup: 1,
      tournamentStage: 1,
      nationalTeam: 2,
      match: 1
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
