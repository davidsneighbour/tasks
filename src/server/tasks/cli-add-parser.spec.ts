import { describe, expect, it } from "vitest";
import { CliError, parseDueDate, parseInput } from "./cli-add-parser.js";

describe("parseInput", () => {
  it("recognises @due, #list, and !label tokens anywhere in the string", () => {
    expect(parseInput("blafasel @20260909 #something")).toEqual({
      title: "blafasel",
      dueToken: "20260909",
      listToken: "something",
      labelNames: [],
    });
  });

  it("joins non-prefixed words into the title in order", () => {
    expect(parseInput("buy milk and eggs")).toEqual({
      title: "buy milk and eggs",
      dueToken: undefined,
      listToken: undefined,
      labelNames: [],
    });
  });

  it("allows multiple !label tokens", () => {
    expect(parseInput("blafasel !urgent !home")).toEqual({
      title: "blafasel",
      dueToken: undefined,
      listToken: undefined,
      labelNames: ["urgent", "home"],
    });
  });

  it("rejects more than one @due token", () => {
    expect(() => parseInput("blafasel @20260909 @20261010")).toThrow(CliError);
  });

  it("rejects more than one #list token", () => {
    expect(() => parseInput("blafasel #one #two")).toThrow(CliError);
  });

  it("rejects an empty title", () => {
    expect(() => parseInput("@20260909 #something")).toThrow(CliError);
  });

  it("treats a bare @, #, or ! as part of the title rather than an annotation", () => {
    expect(parseInput("say hi @ # !")).toEqual({
      title: "say hi @ # !",
      dueToken: undefined,
      listToken: undefined,
      labelNames: [],
    });
  });
});

describe("parseDueDate", () => {
  const now = new Date("2026-09-10T12:00:00.000Z");

  it("parses YYYYMMDD as year-month-day", () => {
    expect(parseDueDate("20260909", now)).toBe("2026-09-09");
  });

  it("parses YYYY-MM-DD directly", () => {
    expect(parseDueDate("2026-09-09", now)).toBe("2026-09-09");
  });

  it("parses +Nd shorthand relative to now", () => {
    expect(parseDueDate("+7d", now)).toBe("2026-09-17");
  });

  it("parses +Nw shorthand in weeks", () => {
    expect(parseDueDate("+2w", now)).toBe("2026-09-24");
  });

  it("parses natural-language single words via chrono", () => {
    expect(parseDueDate("tomorrow", now)).toBe("2026-09-11");
  });

  it("throws a CliError for unparseable input", () => {
    expect(() => parseDueDate("not-a-date-xyz", now)).toThrow(CliError);
  });
});
