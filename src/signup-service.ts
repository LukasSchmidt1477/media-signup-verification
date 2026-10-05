import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { InfraiClient } from "./infra-client.ts";

const SignupSchema = z.object({ email: z.string().email(), password: z.string().min(12), name: z.string().trim().min(1), assetId: z.string().trim().min(1) });
export type SignupInput = z.infer<typeof SignupSchema>;
export type SignupResult = { userId: string; messageId: string; verificationLink: string; asset: { id: string; state: "queued" } };

function validate(input: SignupInput): void {
  SignupSchema.parse(input);
}

export async function signupWithVerification(input: SignupInput, client = new InfraiClient()): Promise<SignupResult> {
  validate(input);
  const idempotencyKey = createHash("sha256").update(`${input.email}:${input.assetId}`).digest("hex");
  const user = await client.request<{ user_id: string }>("/v1/auth/user/create", {
    email: input.email, password: input.password, name: input.name,
    metadata: { media_asset_id: input.assetId }, vendor: "infrai", mode: "signup", idempotency_key: idempotencyKey
  });
  const token = randomUUID();
  const verificationLink = `https://stream.example/verify?token=${token}`;
  const mail = await client.request<{ message_id: string }>("/v1/email/send", {
    to: input.email, subject: "Verify your streaming account",
    html: `<p>Verify your account to receive creator media.</p><p><a href="${verificationLink}">Verify email</a></p>`,
    body: `Verify your streaming account: ${verificationLink}`
  });
  return { userId: user.user_id, messageId: mail.message_id, verificationLink, asset: { id: input.assetId, state: "queued" } };
}
