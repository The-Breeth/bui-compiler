import { parseBUI } from "../src";

describe("BUI Compiler", () => {
  it("parses simple single-file bui", () => {
    const path = __dirname + "/fixtures/simple-index.bui";
    const result = parseBUI(path, { withMetadata: true });
    expect(result.errors).toHaveLength(0);
    expect(result.ast.bPods.length).toBeGreaterThan(0);
    expect(result.metadata?.includedFiles.length).toBe(1);
  });
});
