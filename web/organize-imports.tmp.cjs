// Removes unused imports (TypeScript "organize imports") in the given files.
const ts = require("typescript");
const fs = require("fs");
const path = require("path");
const files = process.argv.slice(2).map((f) => path.resolve(f));
const configPath = ts.findConfigFile(process.cwd(), ts.sys.fileExists, "tsconfig.json");
const config = ts.parseJsonConfigFileContent(ts.readConfigFile(configPath, ts.sys.readFile).config, ts.sys, path.dirname(configPath));
const versions = {};
const host = {
  getScriptFileNames: () => [...new Set([...config.fileNames, ...files])],
  getScriptVersion: (f) => String(versions[f] || 0),
  getScriptSnapshot: (f) => (fs.existsSync(f) ? ts.ScriptSnapshot.fromString(fs.readFileSync(f, "utf8")) : undefined),
  getCurrentDirectory: () => process.cwd(),
  getCompilationSettings: () => config.options,
  getDefaultLibFileName: (o) => ts.getDefaultLibFilePath(o),
  fileExists: ts.sys.fileExists, readFile: ts.sys.readFile, readDirectory: ts.sys.readDirectory,
};
const service = ts.createLanguageService(host, ts.createDocumentRegistry());
for (const file of files) {
  const changes = service.organizeImports({ type: "file", fileName: file, mode: ts.OrganizeImportsMode.RemoveUnused }, { ...ts.getDefaultFormatCodeSettings(), insertSpaceAfterCommaDelimiter: true, insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces: true, semicolons: "insert" }, { quotePreference: "double", organizeImportsIgnoreCase: true });
  let text = fs.readFileSync(file, "utf8");
  for (const change of changes) {
    for (const edit of [...change.textChanges].sort((a, b) => b.span.start - a.span.start)) {
      text = text.slice(0, edit.span.start) + edit.newText + text.slice(edit.span.start + edit.span.length);
    }
  }
  fs.writeFileSync(file, text);
  versions[file] = (versions[file] || 0) + 1;
}
console.log("organized", files.length);
