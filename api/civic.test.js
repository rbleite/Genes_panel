import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import handler from "./civic.js";

/** Minimal Vercel-style res double. */
function makeRes() {
  const res = { code: 200, headers: {} };
  res.status = (c) => ((res.code = c), res);
  res.json = (b) => ((res.body = b), res);
  res.setHeader = (k, v) => ((res.headers[k] = v), res);
  return res;
}

const GENE_NODE = {
  id: 4941,
  name: "ROS1",
  entrezId: 6098,
  link: "/features/4941",
  stats: {
    variantCount: 10,
    molecularProfileCount: 17,
    evidenceItemCount: 32,
    assertionCount: 3,
  },
};

function mockFetchOnce({ ok = true, status = 200, payload }) {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => payload,
  });
}

async function call(gene, method = "GET") {
  const res = makeRes();
  await handler({ method, query: { gene } }, res);
  return res;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  delete global.fetch;
});

describe("civic handler — request validation", () => {
  it("rejects non-GET with 405 and an Allow header", async () => {
    const res = await call("ROS1", "POST");
    expect(res.code).toBe(405);
    expect(res.headers.Allow).toBe("GET");
  });

  it("rejects a missing gene with 400", async () => {
    const res = await call("");
    expect(res.code).toBe(400);
    expect(res.body.error).toMatch(/obrigatório/i);
  });

  it("does not call the upstream API when validation fails", async () => {
    global.fetch = vi.fn();
    await call("");
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe("civic handler — GraphQL request shape", () => {
  it("filters by entrezSymbols and requests the stats block", async () => {
    // Guards the CIViC API v2 contract: the older `genes(name:)` argument
    // and the Gene.evidenceItems / Gene.molecularProfiles fields were
    // removed upstream, which silently broke every lookup.
    mockFetchOnce({ payload: { data: { genes: { nodes: [GENE_NODE] } } } });
    await call("ROS1");

    const [, init] = global.fetch.mock.calls[0];
    const body = JSON.parse(init.body);

    expect(body.query).toContain("entrezSymbols");
    expect(body.query).toContain("stats");
    expect(body.query).not.toMatch(/genes\s*\(\s*name:/);
    expect(body.variables).toEqual({ symbols: ["ROS1"] });
  });

  it("upper-cases the symbol before querying", async () => {
    mockFetchOnce({ payload: { data: { genes: { nodes: [GENE_NODE] } } } });
    await call("ros1");
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.variables.symbols).toEqual(["ROS1"]);
  });
});

describe("civic handler — successful response", () => {
  beforeEach(() => {
    mockFetchOnce({ payload: { data: { genes: { nodes: [GENE_NODE] } } } });
  });

  it("maps every stats counter onto the response", async () => {
    const { code, body } = await call("ROS1");
    expect(code).toBe(200);
    expect(body).toMatchObject({
      source: "CIViC",
      evidenceItemCount: 32,
      variantCount: 10,
      molecularProfileCount: 17,
      assertionCount: 3,
    });
  });

  it("builds an absolute URL from the relative link", async () => {
    const { body } = await call("ROS1");
    expect(body.url).toBe("https://civicdb.org/features/4941");
  });

  it("summarises the counts in the summary string", async () => {
    const { body } = await call("ROS1");
    expect(body.summary).toContain("ROS1");
    expect(body.summary).toContain("32 evidence item");
  });
});

describe("civic handler — gene absent from CIViC", () => {
  it("returns 200 with zeroed counts rather than an error", async () => {
    mockFetchOnce({ payload: { data: { genes: { nodes: [] } } } });
    const { code, body } = await call("CD74");
    expect(code).toBe(200);
    expect(body.summary).toMatch(/sem entrada civic/i);
    expect(body.evidenceItemCount).toBe(0);
  });

  it("falls back to the search URL when there is no gene link", async () => {
    mockFetchOnce({ payload: { data: { genes: { nodes: [] } } } });
    const { body } = await call("CD74");
    expect(body.url).toBe("https://civicdb.org/search?query=CD74");
  });
});

describe("civic handler — upstream failures", () => {
  it("returns 502 when the API answers 200 with GraphQL errors", async () => {
    mockFetchOnce({
      payload: { errors: [{ message: "Field 'genes' doesn't accept argument 'name'" }] },
    });
    const { code, body } = await call("ROS1");
    expect(code).toBe(502);
    expect(body.error).toMatch(/falha ao consultar civic/i);
    expect(body.details).toBeTruthy();
  });

  it("propagates an upstream HTTP error status", async () => {
    mockFetchOnce({ ok: false, status: 503, payload: {} });
    const { code } = await call("ROS1");
    expect(code).toBe(503);
  });

  it("returns 504 when the request is aborted by the timeout", async () => {
    const abort = Object.assign(new Error("aborted"), { name: "AbortError" });
    global.fetch = vi.fn().mockRejectedValue(abort);
    const { code, body } = await call("ROS1");
    expect(code).toBe(504);
    expect(body.error).toMatch(/não respondeu/i);
  });

  it("returns 500 on an unexpected network error", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("ECONNRESET"));
    const { code, body } = await call("ROS1");
    expect(code).toBe(500);
    expect(body.details).toBe("ECONNRESET");
  });
});
