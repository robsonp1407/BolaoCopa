type PasswordResetEmailInput = {
  email: string;
  resetLink: string;
  token: string;
};

export async function sendPasswordResetEmail(input: PasswordResetEmailInput) {
  if (process.env.NODE_ENV !== "production") {
    console.info("Link de redefinicao de senha:", input.resetLink);
    console.info("Token de redefinicao de senha:", input.token);
  }

  return {
    delivered: false,
    developmentLink: input.resetLink
  };
}
