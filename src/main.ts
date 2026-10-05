import { signupWithVerification } from "./signup-service.ts";

const raw = process.env.SIGNUP_JSON ?? '{"email":"creator@example.com","password":"correct-horse-battery","name":"Mina","assetId":"episode-42"}';
const input = JSON.parse(raw);
const result = await signupWithVerification(input);
console.log(JSON.stringify(result, null, 2));
