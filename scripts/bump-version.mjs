#!/usr/bin/env node
/**
 * bump-version.mjs
 * -----------------------------------------------------------------------
 * Incrementa a versão PATCH (semver) em module.json e imprime a nova
 * versão em stdout (consumido pelo workflow de release via
 * $GITHUB_OUTPUT). Primeira execução (a partir de "0.0.0-dev") gera
 * "0.1.0".
 * Uso: node scripts/bump-version.mjs [major|minor|patch]
 * -----------------------------------------------------------------------
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODULE_FILE = path.resolve(__dirname, "..", "module.json");

const bumpType = process.argv[2] ?? "patch";

function parseSemver(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version);
  if (!match) return { major: 0, minor: 0, patch: 0 }; // cobre "0.0.0-dev"
  const [, major, minor, patch] = match;
  return { major: Number(major), minor: Number(minor), patch: Number(patch) };
}

async function main() {
  const raw = await readFile(MODULE_FILE, "utf-8");
  const data = JSON.parse(raw);

  const { major, minor, patch } = parseSemver(data.version);
  let next;
  if (bumpType === "major") next = `${major + 1}.0.0`;
  else if (bumpType === "minor") next = `${major}.${minor + 1}.0`;
  else next = `${major}.${minor}.${patch + 1}`;

  data.version = next;
  await writeFile(MODULE_FILE, JSON.stringify(data, null, 2) + "\n", "utf-8");

  // Única linha em stdout: consumida pelo workflow.
  console.log(next);
}

main();
