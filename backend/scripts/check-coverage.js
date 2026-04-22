#!/usr/bin/env node
/* eslint-disable */
/**
 * Valida coverage-summary.json contra thresholds mínimos.
 * Executado no CI após `npm run test:cov`.
 *
 * Uso: node scripts/check-coverage.js [--summary PATH]
 */
const fs = require("fs");
const path = require("path");

const THRESHOLDS = {
  statements: Number(process.env.COVERAGE_THRESHOLD_STATEMENTS || 85),
  branches: Number(process.env.COVERAGE_THRESHOLD_BRANCHES || 70),
  functions: Number(process.env.COVERAGE_THRESHOLD_FUNCTIONS || 80),
  lines: Number(process.env.COVERAGE_THRESHOLD_LINES || 85),
};

const args = process.argv.slice(2);
let summaryPath = path.resolve(__dirname, "..", "coverage", "coverage-summary.json");
const flagIdx = args.indexOf("--summary");
if (flagIdx !== -1 && args[flagIdx + 1]) {
  summaryPath = path.resolve(process.cwd(), args[flagIdx + 1]);
}

if (!fs.existsSync(summaryPath)) {
  console.error(`[check-coverage] coverage-summary.json not found at ${summaryPath}`);
  process.exit(1);
}

const summary = JSON.parse(fs.readFileSync(summaryPath, "utf-8"));
const total = summary.total;
if (!total) {
  console.error("[check-coverage] invalid summary: missing 'total'");
  process.exit(1);
}

const failures = [];
for (const key of Object.keys(THRESHOLDS)) {
  const actual = total[key]?.pct;
  const expected = THRESHOLDS[key];
  if (typeof actual !== "number") {
    failures.push(`${key}: unable to read pct`);
    continue;
  }
  if (actual < expected) {
    failures.push(`${key}: ${actual.toFixed(2)}% < ${expected}%`);
  } else {
    console.log(`[check-coverage] OK  ${key}: ${actual.toFixed(2)}% >= ${expected}%`);
  }
}

if (failures.length > 0) {
  console.error("\n[check-coverage] Threshold violations:");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log("\n[check-coverage] All thresholds met.");
