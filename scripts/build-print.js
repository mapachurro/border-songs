import { execFileSync } from "node:child_process";
import fs from "node:fs";

const image = "border-songs-latex";
const dockerfile = "docker/latex/Dockerfile";
const outputDir = "dist-print";
const texFile = "dist-print/songbook.tex";

function run(command, args) {
  console.log(`\n> ${command} ${args.join(" ")}\n`);

  execFileSync(command, args, {
    stdio: "inherit",
  });
}

fs.mkdirSync(outputDir, { recursive: true });

// Build the project-owned LaTeX environment.
run("docker", [
  "build",
  "-t",
  image,
  "-f",
  dockerfile,
  ".",
]);

// Generate the book's LaTeX source.
run("node", [
  "scripts/build-songbook.js",
]);

// Compile it.
run("docker", [
  "run",
  "--rm",
  "-v",
  `${process.cwd()}:/work`,
  image,
  "--interaction=nonstopmode",
  "--halt-on-error",
  "--output-directory=dist-print",
  texFile,
]);

console.log("\n✓ Built dist-print/songbook.pdf");