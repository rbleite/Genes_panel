import { describe, it, expect } from "vitest";
import vercel from "../vercel.json";
import pkg from "../package.json";

const headers = Object.fromEntries(
  vercel.headers.find((h) => h.source === "/(.*)").headers.map((h) => [h.key, h.value]),
);
const csp = headers["Content-Security-Policy"];

describe("security headers (vercel.json)", () => {
  it("sets a Content-Security-Policy restricted to the site's own origin", () => {
    expect(csp).toMatch(/default-src 'self'/);
    expect(csp).toMatch(/connect-src 'self'/);   // the browser talks only to this site's /api/*
    expect(csp).toMatch(/object-src 'none'/);
  });

  it("allows no inline or eval'd scripts", () => {
    const scriptSrc = csp.match(/script-src ([^;]+)/)[1];
    expect(scriptSrc).not.toMatch(/unsafe-inline|unsafe-eval/);
  });

  it("sets nosniff and a referrer policy", () => {
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
  });

  it("does not forbid framing — deliberately", () => {
    // The app is linked from the hospital's ePM as prescription support. Until
    // it is confirmed whether ePM embeds it in an iframe, X-Frame-Options and
    // frame-ancestors are left out so the integration cannot break silently.
    // Once confirmed, restrict frame-ancestors to the ePM origin (or 'none').
    expect(headers["X-Frame-Options"]).toBeUndefined();
    expect(csp).not.toMatch(/frame-ancestors/);
  });
});

describe("privacy", () => {
  it("ships no third-party analytics", () => {
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(Object.keys(deps).filter((d) => /analytics|insights|gtag|segment|mixpanel|hotjar/i.test(d))).toEqual([]);
  });
});
