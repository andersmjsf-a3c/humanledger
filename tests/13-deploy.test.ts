// Staging on Vercel: one fixed address for sign-in links and the submit route.
import { describe, it, expect, afterEach } from "vitest";
import { appUrl } from "@/config/app-url";
import { humanOnlyGuard } from "@/lib/http/guards";

const saved = { APP_URL: process.env.APP_URL, VERCEL: process.env.VERCEL_PROJECT_PRODUCTION_URL };
afterEach(() => {
  process.env.APP_URL = saved.APP_URL;
  if (saved.VERCEL === undefined) delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
  else process.env.VERCEL_PROJECT_PRODUCTION_URL = saved.VERCEL;
});

describe("the site's address", () => {
  it("APP_URL wins, then Vercel's production address, else nothing", () => {
    expect(appUrl({ APP_URL: "https://a.test/", VERCEL_PROJECT_PRODUCTION_URL: "b.vercel.app" })).toBe("https://a.test");
    expect(appUrl({ VERCEL_PROJECT_PRODUCTION_URL: "humanledger.vercel.app" })).toBe("https://humanledger.vercel.app");
    expect(appUrl({})).toBeUndefined();
  });

  it("on Vercel, only the production address can send; a preview URL can't", () => {
    delete process.env.APP_URL;
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "humanledger.vercel.app";
    const req = (origin: string) =>
      new Request("https://x/api/scorecards", {
        method: "POST",
        headers: { origin, "sec-fetch-site": "same-origin", cookie: "__Host-csrf=t", "x-csrf-token": "t" },
      });
    expect(humanOnlyGuard(req("https://humanledger.vercel.app")).ok).toBe(true);
    expect(humanOnlyGuard(req("https://humanledger-git-week-8-mark.vercel.app")).ok).toBe(false);
  });
});
