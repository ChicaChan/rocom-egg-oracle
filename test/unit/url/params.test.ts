import { describe, it, expect } from "vitest";
import { parseParams, serializeParams, DEFAULT_TOP_N } from "@/lib/url/params";

describe("parseParams", () => {
  it("解析正常 URL", () => {
    const p = parseParams("size=0.28&weight=2.36&top=5");
    expect(p.sizeM).toBe(0.28);
    expect(p.weightKg).toBe(2.36);
    expect(p.topN).toBe(5);
  });

  it("非法数值返回 null", () => {
    const p = parseParams("size=abc&weight=-3");
    expect(p.sizeM).toBeNull();
    expect(p.weightKg).toBeNull();
  });

  it("topN 默认值", () => {
    const p = parseParams("");
    expect(p.topN).toBe(DEFAULT_TOP_N);
  });

  it("topN 上限裁剪", () => {
    const p = parseParams("top=999");
    expect(p.topN).toBeLessThanOrEqual(20);
  });

  it("size/weight 上限裁剪", () => {
    const p = parseParams("size=999&weight=99999");
    expect(p.sizeM).toBeLessThanOrEqual(10);
    expect(p.weightKg).toBeLessThanOrEqual(5_000);
  });
});

describe("serializeParams", () => {
  it("正常序列化", () => {
    const out = serializeParams({ sizeM: 0.28, weightKg: 2.36 });
    expect(out).toContain("size=0.28");
    expect(out).toContain("weight=2.36");
  });

  it("默认 topN 不输出", () => {
    const out = serializeParams({ sizeM: 0.28, weightKg: 2.36, topN: DEFAULT_TOP_N });
    expect(out).not.toContain("top=");
  });

  it("非默认 topN 输出", () => {
    const out = serializeParams({ sizeM: 0.28, weightKg: 2.36, topN: 5 });
    expect(out).toContain("top=5");
  });

  it("可往返", () => {
    const original = { sizeM: 0.35, weightKg: 7.45, topN: 8 };
    const out = serializeParams(original);
    const back = parseParams(out);
    expect(back).toEqual(original);
  });
});
