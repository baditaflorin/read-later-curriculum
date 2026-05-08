import { describe, expect, it } from "vitest";
import { parseHtml, parseMarkdown, parsePlainText } from "./importers";

describe("article importers", () => {
  it("uses markdown heading as the title", () => {
    const draft = parseMarkdown(
      "# Browser AI\n\nLocal models can summarize private reading material without sending content away.",
    );
    expect(draft.title).toBe("Browser AI");
    expect(draft.content).toContain("Local models");
  });

  it("extracts plain text titles", () => {
    const draft = parsePlainText(
      "A useful article title\n\nThis article has enough text to pass validation and become a useful saved reading.",
    );
    expect(draft.title).toBe("A useful article title");
  });

  it("reads html body text", () => {
    const draft = parseHtml(
      "<html><head><title>HTML Reading</title></head><body><article><p>This article text is long enough to parse and save into the local library for later synthesis.</p></article></body></html>",
    );
    expect(draft.title).toContain("HTML Reading");
    expect(draft.content).toContain("local library");
  });
});
