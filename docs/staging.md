# Staging setup

A private copy of the site on Vercel, with its own Neon database, for testing before the beta. It's the
same setup the real service will run on, locked so only you can open it. About 20 minutes.

You need three accounts: Vercel, Neon (created from inside Vercel), and Resend.

## 1. Vercel: the site

1. Sign up at vercel.com with your GitHub account.
2. **Add New → Project**, pick `andersmjsf-a3c/humanledger`, and click **Deploy**. Leave the build settings
   alone. The repo's `vercel-build` script sets up the database and builds the site.
3. The first deploy fails or comes up without a database. That's expected. Keep going.

Note your production address, for example `humanledger.vercel.app` (Project → Domains). That's the site's
one address. Sign-in links point to it, and it's the only address that can send a scorecard.

## 2. Neon: the database

1. In the Vercel project, open the **Storage** tab and create a **Neon** database (it installs Neon from the
   Vercel Marketplace and makes the Neon account for you). Pick a US West region and the free plan. Leave
   the optional services off.
2. **Connect Project**: choose this project and tick **Production** only. Vercel adds `DATABASE_URL` and
   `DATABASE_URL_UNPOOLED` for you.

Production only, so a pull request's preview can never change the staging database. Previews run without
a database: you can look at pages there, but not sign in.

This is the staging database. Production gets its own at launch, so test scorecards never mix with real ones.

## 3. Resend: sign-in emails

1. Sign up at resend.com **with the email address you'll sign in to the site with**.
2. **API Keys → Create API Key** (sending access). Copy it.

Until a domain is verified in Resend, its test sender only delivers to the address you signed up with.
That's fine for you alone. Beta readers will need a verified domain, which waits on the name.

## 4. Settings in Vercel

Project → **Settings → Environment Variables**, for Production:

| Name | Value |
|---|---|
| `RESEND_API_KEY` | the key from step 3 |
| `EMAIL_FROM` | `onboarding@resend.dev` |

`DATABASE_URL` is already there from step 2. `APP_URL` is optional: without it the site uses the production
address from step 1.

## 5. Lock it

Project → **Settings → Deployment Protection**: choose **All Deployments** with **Vercel Authentication**.
Now only people signed in to Vercel with access to the project can open any page. That's free on every plan.

## 6. Deploy and test

1. **Deployments → the latest → Redeploy**. The build log should say `migrate: database is current`.
2. Open the production address. Sign in with your Resend email and click the link in the email.
3. Finish a worksheet, review the scorecard, and send it. It shows up under **Your history**.
4. On **Grade your work**, download the skill and add it to Claude. Grade a real piece of your own work, open
   the review link it gives you, and send.

That last step is the end-to-end test before the beta.

## Every change after this

Each merge to `main` redeploys staging and brings the database up to date. Each pull request also gets a
preview URL for looking at pages. Previews have no database and can't send scorecards.
