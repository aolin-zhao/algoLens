# Cloudflare deployment

This project targets a single Cloudflare account: three Workers (`algovision-api`, `algovision-web`, `algovision-admin`), D1, R2, KV, Queues, and a Python Container. Confirm current Cloudflare documentation, region availability, Containers plan eligibility, limits, and pricing immediately before provisioning; these change independently of this repository. Production rollout is blocked until the isolation checks below pass.

## Provisioning

1. Install Node 22+ and pnpm 10+, run `pnpm install`, then `pnpm exec wrangler login`.
2. Create D1 with `pnpm exec wrangler d1 create algovision`. Replace the placeholder `database_id` in `apps/api/wrangler.jsonc` with the returned ID.
3. Create R2 bucket `algovision-objects` with `pnpm exec wrangler r2 bucket create algovision-objects`.
4. Create KV namespace with `pnpm exec wrangler kv namespace create CACHE`. Replace the placeholder ID in the API Wrangler config.
5. Create both Queues: `pnpm exec wrangler queues create algovision-executions` and `pnpm exec wrangler queues create algovision-executions-dlq`.
6. Review the `PythonRunner` Durable Object and Container entries in the API config. Verify the account supports the image and instance count. The image is built from `containers/python-runner/Dockerfile` by Wrangler.
7. Set `APP_ORIGIN` and `ADMIN_ORIGIN` in `apps/api/wrangler.jsonc` to exact HTTPS origins. Set the first-admin token with `pnpm exec wrangler secret put ADMIN_BOOTSTRAP_TOKEN --config apps/api/wrangler.jsonc`. Do not put secrets in Vite environment variables.
8. Generate and apply the migration: `pnpm db:generate`, then `pnpm db:migrate:remote`. Execute `scripts/seed.sql` remotely with `pnpm exec wrangler d1 execute algovision --remote --config apps/api/wrangler.jsonc --file scripts/seed.sql`.
9. Run `pnpm build` and `pnpm --filter @algovision/api deploy`. Set `VITE_API_URL` to the API's HTTPS origin during each front-end build, then deploy static assets with `pnpm exec wrangler deploy --config apps/web/wrangler.jsonc` and the admin equivalent. The web and admin Workers serve Vite's `dist` via Workers Static Assets.
10. In Cloudflare DNS and Worker routing, map `api.example.com`, `app.example.com`, and `admin.example.com` to the three Workers. Use exact production domains and TLS. Bootstrap the first admin through the API, then remove the bootstrap secret with `pnpm exec wrangler secret delete ADMIN_BOOTSTRAP_TOKEN --config apps/api/wrangler.jsonc`.

## Verification gates

- Register a user, log in, read seeded Two Sum, run the Python template, confirm stdout, then fetch the private gzip Trace through the authenticated endpoint. Verify direct R2 access is denied.
- Create, update, publish, and delete a problem from admin; confirm the public catalog reflects status and soft deletion. Confirm a regular user receives 403 on all `/api/admin/*` routes.
- Submit duplicate Queue messages for one ID and confirm one final record. Force runner failure and check retries, terminal state, and the dead-letter queue.
- Execute code attempting network access, subprocess spawning, file writes outside its task directory, excessive memory/CPU/output, and cross-job access. Validate actual network isolation and one-container-per-job behavior on Cloudflare. The current Python audit hook and OS limits are defense in depth, not a proven isolation boundary. Do not admit arbitrary public traffic before these checks pass.
- Check R2 retention and cleanup policy for code snapshots and traces. No automatic expiry worker is shipped yet.

Local, staging, and production must use separate D1 databases, R2 buckets, KV namespaces, and Queues. Never run `--remote` migration or seed commands against production by default in development scripts.
