import { describe, it, expect, vi, afterEach } from "vitest";
import handler from "./oncokb.js";

function makeRes() {
  const res = { code: 200, headers: {} };
  res.status = (c) => ((res.code = c), res);
  res.json = (b) => ((res.body = b), res);
  res.setHeader = (k, v) => ((res.headers[k] = v), res);
  return res;
}

const QUERY = { gene: "BRAF", alteration: "V600E", tumorType: "Melanoma" };

async function call(query = QUERY, method = "GET") {
  const res = makeRes();
  await handler({ method, query }, res);
  return res;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  delete global.fetch;
});

describe("oncokb handler — without a licence token", () => {
  it("answers 503 with a message a clinician can act on", async () => {
    vi.stubEnv("ONCOKB_API_TOKEN", "");
    const { code, body } = await call();
    expect(code).toBe(503);
    expect(body.code).toBe("ONCOKB_NOT_CONFIGURED");
    expect(body.error).toMatch(/licença institucional/i);
  });

  it("does not call the upstream API", async () => {
    vi.stubEnv("ONCOKB_API_TOKEN", "");
    global.fetch = vi.fn();
    await call();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe("oncokb handler — with a token", () => {
  it("rejects non-GET with 405", async () => {
    const { code, headers } = await call(QUERY, "POST");
    expect(code).toBe(405);
    expect(headers.Allow).toBe("GET");
  });

  it("requires gene, alteration and tumour type", async () => {
    vi.stubEnv("ONCOKB_API_TOKEN", "test-token");
    const { code } = await call({ gene: "BRAF" });
    expect(code).toBe(400);
  });

  it("maps a successful annotation", async () => {
    vi.stubEnv("ONCOKB_API_TOKEN", "test-token");
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ oncogenic: "Oncogenic", highestSensitiveLevel: "LEVEL_1" }),
    });
    const { code, body } = await call();
    expect(code).toBe(200);
    expect(body.highestSensitiveLevel).toBe("LEVEL_1");
    expect(body.summary).toContain("Oncogenic");
    expect(global.fetch.mock.calls[0][1].headers.Authorization).toBe("Bearer test-token");
  });

  it("propagates an upstream error status", async () => {
    vi.stubEnv("ONCOKB_API_TOKEN", "test-token");
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: "Invalid token" }),
    });
    const { code, body } = await call();
    expect(code).toBe(401);
    expect(body.error).toBe("Invalid token");
  });
});
