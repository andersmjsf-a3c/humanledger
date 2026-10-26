// Staging on Vercel: one fixed address for sign-in links and the submit route.
import { describe, it, expect, afterEach } from "vitest";
import { appUrl } from "@/config/app-url";
import { humanOnlyGuard } from "@/lib/http/guards";
import { databaseUrl } from "@/config/db-url";

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

describe("the database address", () => {
  it("reads DATABASE_URL or Vercel's prefixed STORAGE_DATABASE_URL; migrations prefer the direct connection", () => {
    expect(databaseUrl({ DATABASE_URL: "pooled" })).toBe("pooled");
    expect(databaseUrl({ STORAGE_DATABASE_URL: "p", STORAGE_DATABASE_URL_UNPOOLED: "d" })).toBe("p");
    expect(databaseUrl({ STORAGE_DATABASE_URL: "p", STORAGE_DATABASE_URL_UNPOOLED: "d" }, true)).toBe("d");
    expect(databaseUrl({ DATABASE_URL: "p" }, true)).toBe("p");
    expect(databaseUrl({})).toBeUndefined();
  });
});
