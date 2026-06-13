import { readFile } from "node:fs/promises";
import path from "node:path";

import { PrismaClient } from "@prisma/client";

import { importWorldCupData } from "../src/lib/world-cup/import";

const prisma = new PrismaClient();

async function main() {
  const seedPath =
    process.env.WORLD_CUP_SEED_PATH ??
    path.join(process.cwd(), "prisma", "data", "world-cup-2026.seed.json");
  const rawSeed = await readFile(seedPath, "utf-8");
  const seed = JSON.parse(rawSeed) as unknown;
  const summary = await importWorldCupData(prisma, seed);

  console.info("Dados da Copa importados:", summary);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
