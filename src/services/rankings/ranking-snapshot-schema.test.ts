import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("RankingSnapshot migration contract", () => {
  it("keeps the database migration aligned with the Prisma matchId relation", () => {
    const migration = readFileSync(
      join(
        process.cwd(),
        "prisma",
        "migrations",
        "20260616090000_add_ranking_snapshot_match_id",
        "migration.sql"
      ),
      "utf8"
    );

    expect(migration).toContain('ADD COLUMN "matchId" TEXT');
    expect(migration).toContain('"RankingSnapshot_matchId_fkey"');
    expect(migration).toContain('REFERENCES "Match"("id")');
  });
});
