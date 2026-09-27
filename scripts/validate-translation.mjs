#!/usr/bin/env node
/**
 * validate-translation.mjs
 * -----------------------------------------------------------------------
 * Validação de sanidade do arquivo de tradução, rodada localmente e no
 * workflow de CI (.github/workflows/validate.yml) a cada Pull Request.
 * Falha (exit code 1) se encontrar:
 *   - JSON inválido
 *   - entradas sem "id"
 *   - "id" duplicado
 *   - placeholders esquecidos ("SUBSTITUA_" / "TRADUZIR:")
 *   - module.json inválido ou sem os campos obrigatórios
 * -----------------------------------------------------------------------
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");

const TRANSLATION_FILE = path.join(ROOT_DIR, "packs", "dnd-heroes-borderlands.items.json");
const MODULE_FILE = path.join(ROOT_DIR, "module.json");

const errors = [];
const warnings = [];

function findPlaceholders(obj, trail = "") {
  if (typeof obj === "string") {
    if (obj.includes("SUBSTITUA_") || obj.includes("TRADUZIR:")) {
      warnings.push(`Placeholder não preenchido em: ${trail}`);
    }
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => findPlaceholders(v, `${trail}[${i}]`));
    return;
  }
  if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      findPlaceholders(v, trail ? `${trail}.${k}` : k);
    }
  }
}

async function validateTranslationFile() {
  let raw;
  try {
    raw = await readFile(TRANSLATION_FILE, "utf-8");
  } catch {
    errors.push(`Arquivo não encontrado: ${path.relative(ROOT_DIR, TRANSLATION_FILE)}`);
    return;
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    errors.push(`JSON inválido em ${path.relative(ROOT_DIR, TRANSLATION_FILE)}: ${e.message}`);
    return;
  }

  if (!Array.isArray(data.entries)) {
    errors.push(`Campo "entries" ausente ou não é um array.`);
    return;
  }

  const seenIds = new Set();
  data.entries.forEach((entry, i) => {
    if (!entry.id) {
      errors.push(`Entrada #${i} sem campo "id".`);
      return;
    }
    if (seenIds.has(entry.id)) {
      errors.push(`ID duplicado: "${entry.id}".`);
    }
    seenIds.add(entry.id);
  });

  findPlaceholders(data.entries);

  console.log(`Entradas verificadas: ${data.entries.length}`);
}

async function validateModuleFile() {
  let raw;
  try {
    raw = await readFile(MODULE_FILE, "utf-8");
  } catch {
    errors.push(`module.json não encontrado.`);
    return;
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    errors.push(`module.json com JSON inválido: ${e.message}`);
    return;
  }

  for (const field of ["id", "title", "version", "esmodules"]) {
    if (!data[field]) errors.push(`module.json: campo obrigatório ausente "${field}".`);
  }
}

async function main() {
  await validateModuleFile();
  await validateTranslationFile();

  if (warnings.length > 0) {
    console.warn(`\n${warnings.length} aviso(s):`);
    warnings.forEach((w) => console.warn(`  - ${w}`));
  }

  if (errors.length > 0) {
    console.error(`\n${errors.length} erro(s):`);
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log("\nValidação concluída sem erros.");
}

main();
