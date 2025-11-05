#!/usr/bin/env node

/**
 * generate-third-party-list.js (CommonJS version)
 * Generates a Markdown list of third-party deps from /web project
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");


// --- Step 1. Define paths ---
const ROOT_DIR = process.cwd();
const WEB_DIR = path.join(ROOT_DIR, "web");
const DEPS_JSON = path.join(ROOT_DIR, "deps.json");
const OUTPUT_MD = path.join(ROOT_DIR, "THIRD_PARTY_LIBRARIES.md");

// --- Step 2. Run npm ls inside /web ---
console.log("📦 Collecting dependency info from /web ...");
try {
  execSync(`cd ${WEB_DIR} && npm ls --json --long > ${DEPS_JSON}`, { stdio: "inherit" });
} catch {
  // npm ls exits non-zero if peer deps warnings exist → ignore
  console.log("⚠️  npm ls returned warnings (this is fine).");
}

// --- Step 3. Parse dependency info ---
if (!fs.existsSync(DEPS_JSON)) {
  console.error("❌ deps.json not found. Check if /web/package.json exists.");
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(DEPS_JSON, "utf8"));
const rows = [];

function traverse(deps, optionalDeps = {}) {
  if (!deps) return;
  for (const [name, info] of Object.entries(deps)) {
    const pkgPath = path.join(WEB_DIR, "node_modules", name, "package.json");
    let license = "unknown";
    let homepage = "N/A";

    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      license = pkg.license || pkg.licenses?.[0]?.type || "unknown";
      homepage = pkg.homepage || pkg.repository?.url || "N/A";
    } catch {
      // ignore
    }

    rows.push({
      name,
      version: info.version,
      license,
      homepage,
      optional: !!optionalDeps[name],
    });

    traverse(info.dependencies, optionalDeps);
  }
}

traverse(data.dependencies, data.optionalDependencies);

// --- Step 4. Deduplicate and sort ---
const unique = [];
const seen = new Set();
for (const r of rows) {
  const key = `${r.name}@${r.version}`;
  if (!seen.has(key)) {
    seen.add(key);
    unique.push(r);
  }
}
unique.sort((a, b) => a.name.localeCompare(b.name));

// --- Step 5. Generate Markdown ---
let md = `# 📦 Third-party Dependencies (Next.js: /web)\n\n`;
md += `| Package | Version | License | Optional |\n`;
md += `|----------|----------|----------|-----------|\n`;
for (const r of unique) {
  const name = r.homepage === "N/A" ? `${r.name}` : `[${r.name}](${r.homepage})`;
  md += `| ${name} | ${r.version} | ${r.license} | ${r.optional ? "✅" : "❌"} |\n`;
}

// --- Step 6. Write result and clean up ---
fs.writeFileSync(OUTPUT_MD, md);
fs.rmSync(DEPS_JSON, { force: true });
console.log(`✅ Generated ${path.basename(OUTPUT_MD)} successfully!`);
