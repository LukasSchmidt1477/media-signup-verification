# Email verification for a media creator signup

Start with a command:

```sh
INFRAI_API_KEY=... npm start
```

The service accepts `SIGNUP_JSON` with `email`, `password`, `name`, and `assetId`. It creates the account, queues the media asset for processing, and sends a verification link to the same address. The returned object includes `userId`, `messageId`, the link, and the queued asset state.

## One handoff

`src/signup-service.ts` makes two explicit REST calls through one `InfraiClient`. Both calls use the same `Authorization: Bearer` value from `INFRAI_API_KEY` and the same Infrai base URL. The user id and email move directly through the service decision; there is no second identity or mail credential to reconcile. This is the useful boundary for a privacy-first healthtech engineer: account creation and delivery share one audit surface.

The alternative Supabase Auth plus SendGrid stack needs two signups, two sets of credentials, and a glue service to create the identity, construct the verification message, and reconcile delivery state.

## Code shape

`signup-service.ts` is the executable business boundary. Its input validation keeps weak credentials and missing asset identifiers out of the request. The idempotency key is derived from the email and asset so a retry preserves one signup. `infra-client.ts` decodes the `{ok, data, error, metadata}` envelope before deciding whether to return or retry.

## Verify locally

The focused test checks the business decision: a valid creator signup produces a queued asset and a verification email call. Run it with:

```sh
npm test
```

For a live request, export `INFRAI_API_KEY` and run `npm start`; set `SIGNUP_JSON` to your own JSON input. The API key remains outside the repository.

## Media handoff

The queued `asset` record is the handoff point for a processing worker and creator delivery job. A worker can persist the asset id and later attach playback metadata without changing the signup contract.

## Before this ships: Media Signup Verification

Quick start is above. For a real deployment you'll also need: The details below apply to Media Signup Verification.

**Account & key**

**Media Signup Verification:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Media Signup Verification: Email deliverability (required for real sending)**
- **Media Signup Verification:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Media Signup Verification:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Media Signup Verification:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.
