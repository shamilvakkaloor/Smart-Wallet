# Hostinger first-time setup

Connecting GitHub deploys the source code. It does not create a database or Google OAuth credentials.

## 1. Check the deployment

In hPanel, open Websites → your site's Dashboard → Deployments. Open the latest deployment and review its status and logs. Copy the public website URL for the Google configuration below.

Use the repository root (the folder containing `package.json`), the Next.js framework, and Node.js 22. The project build script is `npm run build`. Hostinger installs dependencies during deployment. Do not select a static HTML-only deployment for this application.

## 2. Create a MySQL database

Create a database and a database user in Hostinger's database management area. Record the database hostname, port, full database name, full username and password privately. Grant that user access to this database. Use the hostname Hostinger provides; do not assume it is `localhost`.

## 3. Configure Google login

In Google Cloud Console, create/select a project, configure the OAuth consent screen and create an OAuth **Web application** client. While the consent app is in testing, add your own Google email as a test user.

Add this authorized redirect URI, replacing the origin with your actual HTTPS site URL:

```text
https://YOUR-SITE/api/auth/callback/google
```

The scheme, domain and path must match exactly. Keep the client secret private.

## 4. Add environment variables in Hostinger

In the site's deployment settings, add these values. The values below are placeholders; do not use them literally or commit real values to GitHub.

| Name | Value |
|---|---|
| `DATABASE_URL` | `mysql://USERNAME:PASSWORD@HOST:3306/DATABASE` using Hostinger's details |
| `AUTH_SECRET` | A securely generated random secret |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `ALLOWED_EMAIL` | Your exact Google email address |
| `AUTH_URL` | Your public HTTPS site origin |
| `APP_URL` | The same public HTTPS site origin |
| `AUTH_TRUST_HOST` | `true` |
| `UPLOAD_DIR` | A durable writable directory outside public web files |

URL-encode special characters in the username/password components of `DATABASE_URL`. Google credentials and database credentials are separate. `APP_URL` alone does not configure Auth.js's URL; `AUTH_URL` is recognized by the installed authentication library.

Generate a secret on a computer with Node.js:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Store this output directly in Hostinger; do not send it in chat.

## 5. Create the application's tables and starter data

Once the database environment is configured, run these commands from the application project directory in an environment that can reach the Hostinger database:

```sh
npm run db:deploy
npm run db:seed
```

The commands need the project's dependencies and `DATABASE_URL`. If your plan provides SSH/application terminal access, use that. Otherwise, determine the supported migration execution method before proceeding; simply rebuilding the site does not run these commands. The existing build script generates Prisma Client but does not apply migrations or seed data.

Use `db:deploy` for production migrations, not `db:migrate` (which runs Prisma's development migration command).

## 6. Redeploy and verify

Redeploy the latest GitHub commit after saving environment variables. Visit `/login`, sign in with the allowed email, and confirm OMR and INR wallets exist. If anything fails, inspect the deployment/runtime logs and share the error text with secrets removed.

The code fix in `lib/auth-adapter.ts` routes OAuth identities to `auth_accounts`; no database-schema migration is required specifically for that fix. Initial database creation is still required.

## References

- [Hostinger deployment troubleshooting](https://www.hostinger.com/support/fix-failed-to-build-application-error-hostinger-node-js/)
- [Hostinger environment-variable setup](https://www.hostinger.com/support/how-to-add-environment-variables-during-node-js-application-deployment/)
- [Original project setup guide](SETUP.md)

The architecture review still lists financial and other V1 gaps. Successful deployment is not confirmation that all V1 requirements are complete.
