const esbuild = require("esbuild");
const fs = require("node:fs");
const path = require("node:path");

const DIST = path.join(__dirname, "dist");

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

esbuild.buildSync({
  entryPoints: ["src/popup.ts", "src/options.ts"],
  outdir: DIST,
  bundle: true,
  format: "iife",
  target: "es2020",
});

for (const file of ["manifest.json", "src/popup.html", "src/options.html"]) {
  fs.copyFileSync(path.join(__dirname, file), path.join(DIST, path.basename(file)));
}
fs.cpSync(path.join(__dirname, "icons"), path.join(DIST, "icons"), { recursive: true });

console.log("Built extension to", DIST);
