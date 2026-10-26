// The one address this site accepts scorecards from, and puts in sign-in links.
// APP_URL wins. On Vercel without it, the project's production address is used, so a
// staging deploy works with no extra setting. Preview deploys (one URL per pull request)
// don't match it, so they can be read but can't send scorecards. That's on purpose.
export function appUrl(env: Record<string, string | undefined> = process.env): string | undefined {
  if (env.APP_URL) return env.APP_URL.replace(/\/+$/, "");
  if (env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return undefined;
}
