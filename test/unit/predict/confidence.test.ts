import { describe, it, expect } from "vitest";
import { confidenceFromDistance } from "@/lib/predict/confidence";

describe("confidenceFromDistance", () => {
  it("0 距离 → exact", () => {
    const c = confidenceFromDistance(0);
    expect(c.level).toBe("exact");
    expect(c.label).toBe("极有可能");
  });

  it("0.2 距离 → high", () => {
    expect(confidenceFromDistance(0.2).level).toBe("high");
  });

  it("0.5 距离 → medium", () => {
    expect(confidenceFromDistance(0.5).level).toBe("medium");
  });

  it("0.8 距离 → low", () => {
    expect(confidenceFromDistance(0.8).level).toBe("low");
  });

  it("超过 1 → edge", () => {
    expect(confidenceFromDistance(1.5).level).toBe("edge");
  });
});
