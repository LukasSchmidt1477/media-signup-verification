import assert from "node:assert/strict";
import { signupWithVerification } from "../src/signup-service.ts";

class FakeClient { calls: Array<{path: string; body: Record<string, unknown>}> = []; async request<T>(path: string, body: Record<string, unknown>): Promise<T> { this.calls.push({path, body}); return (path.includes("user/create") ? {user_id: "u-1"} : {message_id: "m-1"}) as T; } }
const client = new FakeClient();
const result = await signupWithVerification({email: "creator@example.com", password: "correct-horse-battery", name: "Mina", assetId: "episode-42"}, client as never);
assert.equal(result.asset.state, "queued");
assert.equal(result.userId, "u-1");
assert.equal(client.calls[0].path, "/v1/auth/user/create");
assert.equal(client.calls[1].path, "/v1/email/send");
assert.match(String(client.calls[1].body.html), /Verify email/);
assert.match(String(client.calls[1].body.body), /Verify your streaming account:/);
assert.equal(Object.hasOwn(client.calls[1].body, "text"), false);
console.log("signup decision test passed");
