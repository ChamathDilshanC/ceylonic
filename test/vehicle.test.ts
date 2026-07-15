import { describe, expect, it } from "vitest";
import { isValidVehicleNumber, parseVehicleNumber } from "../src/vehicle";

describe("parseVehicleNumber — happy path", () => {
  it("parses a 3-letter plate with a hyphen", () => {
    expect(parseVehicleNumber("CAB-1234")).toEqual({
      valid: true,
      letters: "CAB",
      digits: "1234",
      formatted: "CAB-1234",
      error: null,
    });
  });

  it("parses a 2-letter plate", () => {
    const r = parseVehicleNumber("KV-1234");
    expect(r.valid).toBe(true);
    expect(r.letters).toBe("KV");
    expect(r.formatted).toBe("KV-1234");
  });
});

describe("parseVehicleNumber — input normalization", () => {
  it("normalizes lowercase input", () => {
    expect(parseVehicleNumber("cab-1234").formatted).toBe("CAB-1234");
  });

  it("normalizes a space separator instead of a hyphen", () => {
    expect(parseVehicleNumber("CAB 1234").formatted).toBe("CAB-1234");
  });

  it("normalizes no separator at all", () => {
    expect(parseVehicleNumber("CAB1234").formatted).toBe("CAB-1234");
  });

  it("normalizes surrounding whitespace", () => {
    expect(parseVehicleNumber("  CAB-1234  ").formatted).toBe("CAB-1234");
  });
});

describe("parseVehicleNumber — letter-count boundaries", () => {
  it("rejects a single-letter prefix (legacy format, out of scope)", () => {
    expect(parseVehicleNumber("K-1234").valid).toBe(false);
  });

  it("rejects a 4-letter prefix", () => {
    expect(parseVehicleNumber("CABD-1234").valid).toBe(false);
  });
});

describe("parseVehicleNumber — digit-count boundaries", () => {
  it("rejects fewer than 4 digits", () => {
    expect(parseVehicleNumber("CAB-123").valid).toBe(false);
  });

  it("rejects more than 4 digits", () => {
    expect(parseVehicleNumber("CAB-12345").valid).toBe(false);
  });
});

describe("parseVehicleNumber — invalid input", () => {
  it("rejects a digit inside the letter portion", () => {
    expect(parseVehicleNumber("CA1-1234").valid).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(parseVehicleNumber("").valid).toBe(false);
  });

  it("returns a descriptive error message", () => {
    expect(parseVehicleNumber("???").error).toMatch(/invalid vehicle registration format/i);
  });

  it("returns all-null fields alongside valid: false", () => {
    expect(parseVehicleNumber("???")).toEqual({
      valid: false,
      letters: null,
      digits: null,
      formatted: null,
      error: expect.any(String),
    });
  });

  it("rejects non-string input without throwing", () => {
    // @ts-expect-error deliberate wrong type to verify runtime guard
    const r = parseVehicleNumber(1234);
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/string/i);
  });
});

describe("isValidVehicleNumber", () => {
  it("returns a boolean without throwing", () => {
    expect(isValidVehicleNumber("CAB-1234")).toBe(true);
    expect(isValidVehicleNumber("N-123")).toBe(false);
  });
});
