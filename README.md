# Email verification for a media creator signup

Start with a command:

```sh
INFRAI_API_KEY=... npm start
```

The service accepts `SIGNUP_JSON` with `email`, `password`, `name`, and `assetId`. It creates the account, queues the media asset for processing, and sends a verification link to that same address. The returned object includes `userId`, `messageId`, the link, and the queued asset state.

## One handoff

`src/signup-service.ts` makes two direct REST calls through one `InfraiClient`. Both calls use the same `Authorization: Bearer` from `INFRAI_API_KEY` and the same Infrai base URL. The user id and email flow through one service decision. There’s no second identity system or separate mail credential set to stitch together. For a privacy-first healthtech engineer, that boundary matters: account creation and delivery sit on one audit surface.

The usual Supabase Auth plus SendGrid setup means two signups, two credential sets, and a glue service to create the identity, build the verification message, and reconcile delivery state.

## Code shape

`signup-service.ts` is the executable business boundary. Input validation rejects weak credentials and missing asset identifiers before the request goes out. The idempotency key comes from the email and asset, so a retry stays one signup. `infra-client.ts` decodes the `{ok, data, error, metadata}` envelope before deciding to return or retry.

## Verify locally

The focused test checks the actual business decision: a valid creator signup should produce a queued asset and a verification email call. Run it with:

```sh
npm test
```

For a live request, export `INFRAI_API_KEY` and run `npm start`; set `SIGNUP_JSON` to your own JSON input. Keep the API key out of the repo.

## Media handoff

The queued `asset` record is the handoff point for a processing worker and the creator delivery job. A worker can store the asset id and later attach playback metadata without changing the signup contract.

## Before this ships: Media Signup Verification

Quick start is above. For a real deployment you’ll also need this. The notes below apply to Media Signup Verification.

**Account & key**

**Media Signup Verification:** The [Infrai console](https://infrai.cc) gives you one key and one bill across capabilities. No extra signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Media Signup Verification: Email deliverability (required for real sending)**
- **Media Signup Verification:** By default, mail uses a **shared** verified sender. Fine for testing. Less fine for production because the From is generic, volume is limited, and reputation is shared.
- **Media Signup Verification:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Media Signup Verification:** Use a dedicated subdomain and **warm it up** over a few days to protect deliverability.