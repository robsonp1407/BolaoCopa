import { PrismaClient } from "@prisma/client";

import {
  type GoogleLoginUserInput,
  registerGoogleLoginUsers
} from "../src/services/users/register-google-login-users";

const users: GoogleLoginUserInput[] = [
  { name: "Denise Galv\u00e3o", email: "denise.farmacia@gmail.com" },
  { name: "Juan Francisco", email: "juanfrcogalvao@gmail.com" },
  { name: "Keila Nara Galvao", email: "naragalvao08@gmail.com" },
  { name: "Marcia Galv\u00e3o", email: "marcia.galvaodasilva@gmail.com" },
  { name: "Matheus Pavan", email: "matheusp2903@gmail.com" },
  { name: "Vinicius Garcia", email: "vinigarcia87@gmail.com" }
];

const prisma = new PrismaClient();

async function main() {
  const joinCode = readOption("--join-code");
  const summary = await registerGoogleLoginUsers(prisma, users, { joinCode });

  console.info("Cadastro de usuarios Google concluido:");
  console.info(JSON.stringify(summary, null, 2));
}

function readOption(name: string) {
  const prefix = `${name}=`;
  const inlineValue = process.argv.find((argument) =>
    argument.startsWith(prefix)
  );

  if (inlineValue) {
    return inlineValue.slice(prefix.length).trim() || undefined;
  }

  const optionIndex = process.argv.indexOf(name);
  const nextValue = process.argv[optionIndex + 1];

  if (optionIndex >= 0 && nextValue && !nextValue.startsWith("--")) {
    return nextValue.trim() || undefined;
  }

  return undefined;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
