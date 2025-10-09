#!/usr/bin/env node
// Simple MongoDB dump to JSON and CSV
// Usage examples:
//   node scripts/dump-db.mjs --out dumps
//   node scripts/dump-db.mjs --collections users,partners --out dumps

import fs from "fs";
import { MongoClient } from "mongodb";
import path from "path";

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--collections" || a === "-c") {
      args.collections = (argv[++i] || "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
    } else if (a === "--out" || a === "-o") {
      args.out = argv[++i];
    } else if (a === "--uri") {
      args.uri = argv[++i];
    }
  }
  return args;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function toCsv(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return "";
  // gather shallow keys
  const keys = new Set();
  for (const r of rows) {
    if (r && typeof r === "object") {
      Object.keys(r).forEach(k => keys.add(k));
    }
  }
  const headers = Array.from(keys);
  const esc = v => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "string" ? v : JSON.stringify(v);
    const needsQuotes = /[",\n]/.test(s);
    const content = s.replace(/"/g, '""');
    return needsQuotes ? `"${content}"` : content;
  };
  const lines = [headers.join(",")];
  for (const r of rows) {
    const line = headers.map(h => esc(r?.[h])).join(",");
    lines.push(line);
  }
  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv);
  const uri = args.uri || process.env["MONGODB_URI"];
  if (!uri) {
    console.error("MONGODB_URI not set. Provide via env or --uri.");
    process.exit(1);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();

    let targetCollections = args.collections;
    if (!targetCollections || targetCollections.length === 0) {
      const infos = await db.listCollections().toArray();
      targetCollections = infos.map(i => i.name);
    }

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outRoot = args.out || path.join("dumps");
    const outDir = path.join(outRoot, stamp);
    ensureDir(outDir);

    for (const name of targetCollections) {
      const col = db.collection(name);
      const docs = await col.find({}).toArray();
      // Normalize _id to string for CSV friendliness
      const normalized = docs.map(d => ({
        ...d,
        _id: d?._id ? String(d._id) : d?._id,
      }));

      const jsonPath = path.join(outDir, `${name}.json`);
      const csvPath = path.join(outDir, `${name}.csv`);
      fs.writeFileSync(jsonPath, JSON.stringify(normalized, null, 2), "utf8");
      fs.writeFileSync(csvPath, toCsv(normalized), "utf8");
      console.log(`✔ Dumped ${name}: ${jsonPath} | ${csvPath}`);
    }

    console.log(`✓ Done. Output: ${outDir}`);
  } catch (err) {
    console.error("Dump failed:", err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
