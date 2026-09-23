import { describe, expect, it } from "vitest";
import { formatMoney, formatMoneyCompact } from "@/lib/moneda";

describe("formatMoney", () => {
  it("appends the ISO code to $-currencies so they're unambiguous", () => {
    expect(formatMoney(1500, "USD")).toBe("$1,500 USD");
    expect(formatMoney(2500000, "COP")).toMatch(/^\$\s?2\.500\.000 COP$/);
    expect(formatMoney(1200, "MXN")).toMatch(/1,200 MXN$/);
  });

  it("uses R$ without a code for BRL", () => {
    expect(formatMoney(1000, "BRL")).toMatch(/^R\$\s?1\.000$/);
  });

  it("defaults to USD and shows no decimals", () => {
    expect(formatMoney(10.6)).toBe("$11 USD");
  });
});

describe("formatMoneyCompact", () => {
  it("abbreviates large amounts for chart axes", () => {
    expect(formatMoneyCompact(12000, "USD")).toBe("$12K");
  });
});
