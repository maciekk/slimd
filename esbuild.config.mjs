import esbuild from "esbuild";

const prod = process.argv[2] === "production";
const watch = !prod;

const context = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  outfile: "main.js",
  platform: "browser",
  format: "cjs",
  target: "es2018",
  sourcemap: prod ? false : "inline",
  minify: prod,
  external: ["obsidian", "electron", "@codemirror/*"],
  logLevel: "info"
});

if (watch) {
  await context.watch();
  console.log("Watching for changes...");
} else {
  await context.rebuild();
  await context.dispose();
  console.log("Build complete");
}
