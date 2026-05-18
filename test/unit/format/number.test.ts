import { describe, it, expect } from "vitest";
import {
  roundTo,
  clamp,
  normalizeDecimalInput,
  formatSizeRange,
  formatWeightRange,
  formatPercent,
} from "@/lib/format/number";

describe("roundTo", () => {
  it("基础四舍五入", () => {
    expect(roundTo(1.2345, 2)).toBe(1.23);
    expect(roundTo(1.2355, 2)).toBe(1.24);
  });
});

describe("clamp", () => {
  it("上下边界", () => {
    expect(clamp(5, 1, 10)).toBe(5);
    expect(clamp(0, 1, 10)).toBe(1);
    expect(clamp(20, 1, 10)).toBe(10);
  });
});

describe("normalizeDecimalInput", () => {
  it("剥离非数字字符", () => {
    expect(normalizeDecimalInput("0.35m")).toBe("0.35");
    expect(normalizeDecimalInput("7.45 kg")).toBe("7.45");
    expect(normalizeDecimalInput("abc")).toBe("");
  });

  it("补全前导 0", () => {
    expect(normalizeDecimalInput(".5")).toBe("0.5");
  });
});

describe("format ranges", () => {
  it("size 区间", () => {
    expect(formatSizeRange(0.23, 0.32)).toContain("0.23");
    expect(formatSizeRange(0.23, 0.32)).toContain("0.32");
    expect(formatSizeRange(1, 1)).toBe("1 m");
  });
  it("weight 区间", () => {
    expect(formatWeightRange(1.93, 2.8)).toContain("1.93");
    expect(formatWeightRange(1.93, 2.8)).toContain("2.8");
  });
  it("百分比", () => {
    expect(formatPercent(85.456)).toBe("85.5%");
  });
});
