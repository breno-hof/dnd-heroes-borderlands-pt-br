#!/usr/bin/env node
/**
 * generate-translation.mjs
 * -----------------------------------------------------------------------
 * Gera/atualiza automaticamente `packs/dnd-heroes-borderlands.actors.json`
 * a partir dos JSONs originais do compêndio (em inglês), colocados em
 * `source/actors/`.
 *
 * IMPORTANTE (uso pretendido):
 *   - `source/actors/` NÃO é versionado no Git (está no .gitignore),
 *     pois contém conteúdo original de terceiros. Ele é apenas a matéria
 *     -prima local para gerar o esqueleto de tradução.
 *   - O script é ADITIVO e NÃO-DESTRUTIVO: ele nunca sobrescreve uma
 *     entrada que você já traduziu. Ele só ADICIONA atores novos que
 *     ainda não existem no arquivo de tradução.
 *
 * Como obter os JSONs de origem:
 *   Use o comando `fvtt package unpack` (Foundry CLI) ou o módulo
 *   "D&D - Translation files generator for Babele" para exportar cada
 *   Actor do pack `dnd-heroes-borderlands.actors` como um .json
 *   individual dentro de `source/actors/`.
 *
 * Uso:
 *   node scripts/generate-translation.mjs
 * -----------------------------------------------------------------------
 */

import { readdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");

const SOURCE_DIR = path.join(ROOT_DIR, "source", "actors");
const OUTPUT_FILE = path.join(ROOT_DIR, "packs", "dnd-heroes-borderlands.actors.json");

const DEFAULT_LABEL = "Heroes of Borderlands — Atores (PT-BR)";

const DEFAULT_MAPPING = {
  name: "name",
  "system.details.biography.value": "system.details.biography.value",
  "system.details.trait": "system.details.trait",
  "system.details.ideal": "system.details.ideal",
  "system.details.bond": "system.details.bond",
  "system.details.flaw": "system.details.flaw",
  items: "items",
  effects: "effects",
};

/** Leitura segura de um caminho aninhado (dot path). */
function getAt(obj, dotPath) {
  return dotPath.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

/** Converte um Item embutido do Actor em uma entrada traduzível mínima. */
function extractItem(item) {
  const description = getAt(item, "system.description.value");
  const entry = { id: item._id, name: item.name };
  if (description && String(description).trim().length > 0) {
    entry.system = { description: { value: description } };
  }
  return entry;
}

/** Converte um ActiveEffect embutido em entrada traduzível mínima. */
function extractEffect(effect) {
  return { id: effect._id, name: effect.name ?? effect.label ?? "" };
}

/** Constrói a entrada Babele de um único documento Actor bruto. */
function buildEntry(actor) {
  const entry = { id: actor._id, name: actor.name ?? "" };

  const bio = getAt(actor, "system.details.biography.value");
  if (bio && String(bio).trim().length > 0) {
    entry["system.details.biography.value"] = bio;
  }

  for (const field of ["trait", "ideal", "bond", "flaw"]) {
    const value = getAt(actor, `system.details.${field}`);
    if (value && String(value).trim().length > 0) {
      entry[`system.details.${field}`] = value;
    }
  }

  if (Array.isArray(actor.items) && actor.items.length > 0) {
    entry.items = actor.items.map(extractItem);
  }

  if (Array.isArray(actor.effects) && actor.effects.length > 0) {
    entry.effects = actor.effects.map(extractEffect);
  }

  return entry;
}

/** Lê todos os arquivos-fonte, suportando 1 arquivo por Actor ou um array com vários. */
async function loadSourceActors() {
  let files;
  try {
    files = await readdir(SOURCE_DIR);
  } catch {
    throw new Error(
      `Diretório de origem não encontrado: ${SOURCE_DIR}\n` +
      `Coloque ali os JSONs originais dos Actors (ver instruções no topo deste arquivo).`
    );
  }

  const jsonFiles = files.filter((f) => f.endsWith(".json"));
  if (jsonFiles.length === 0) {
    throw new Error(`Nenhum .json encontrado em ${SOURCE_DIR}.`);
  }

  const actors = [];
  for (const file of jsonFiles) {
    const raw = await readFile(path.join(SOURCE_DIR, file), "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      actors.push(...parsed);
    } else {
      actors.push(parsed);
    }
  }
  return actors;
}

async function loadExistingTranslation() {
  try {
    await access(OUTPUT_FILE);
  } catch {
    return { label: DEFAULT_LABEL, mapping: DEFAULT_MAPPING, entries: [] };
  }
  const raw = await readFile(OUTPUT_FILE, "utf-8");
  return JSON.parse(raw);
}

async function main() {
  const sourceActors = await loadSourceActors();
  const translationFile = await loadExistingTranslation();

  const existingIds = new Set(translationFile.entries.map((e) => e.id));

  let added = 0;
  for (const actor of sourceActors) {
    if (!actor._id) continue;
    if (existingIds.has(actor._id)) continue; // nunca sobrescreve traduções existentes
    translationFile.entries.push(buildEntry(actor));
    existingIds.add(actor._id);
    added++;
  }

  await writeFile(OUTPUT_FILE, JSON.stringify(translationFile, null, 2) + "\n", "utf-8");

  console.log(`Atores lidos de source/actors: ${sourceActors.length}`);
  console.log(`Novas entradas adicionadas:    ${added}`);
  console.log(`Total no arquivo de tradução:  ${translationFile.entries.length}`);
  console.log(`Arquivo atualizado: ${path.relative(ROOT_DIR, OUTPUT_FILE)}`);
}

main().catch((err) => {
  console.error(`Erro: ${err.message}`);
  process.exit(1);
});
