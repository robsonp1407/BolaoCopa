import crypto from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateJoinCode(length = 6) {
  let code = "";

  for (let index = 0; index < length; index += 1) {
    code += ALPHABET[crypto.randomInt(0, ALPHABET.length)];
  }

  return code;
}
