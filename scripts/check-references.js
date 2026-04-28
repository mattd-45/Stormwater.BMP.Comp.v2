#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const V3_DIR = path.join(ROOT, 'v3');

const required = [];
const optional = [];
const errors = [];
const warnings = [];

function rel(absPath) {
  return path.relative(ROOT, absPath).replace(/\\/g, '/');
}

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function stripRef(ref) {
  return String(ref || '').trim().split('#')[0].split('?')[0];
}

function isExternalOrEmpty(ref) {
  const value = String(ref || '').trim();
  return (
    !value ||
    value === '#' ||
    value.startsWith('data:') ||
    value.startsWith('mailto:') ||
    value.startsWith('tel:') ||
    value.startsWith('javascript:') ||
    /^[a-z][a-z0-9+.-]*:\/\//i.test(value)
  );
}

function resolveLocal(ref, baseDir) {
  const cleaned = stripRef(ref);
  if (!cleaned) return null;
  if (cleaned.startsWith('/')) return path.join(ROOT, cleaned.slice(1));
  return path.resolve(baseDir, cleaned);
}

function addCheck(group, source, ref, baseDir, note) {
  if (isExternalOrEmpty(ref)) return;
  const abs = resolveLocal(ref, baseDir);
  if (!abs) return;
  group.push({ source, ref, abs, note: note || '' });
}

function checkHtmlFile(relPath) {
  const source = relPath;
  const html = read(relPath);
  const baseDir = path.dirname(path.join(ROOT, relPath));
  const attrRe = /\b(?:src|href)=["']([^"']+)["']/gi;
  let match;

  while ((match = attrRe.exec(html)) !== null) {
    addCheck(required, source, match[1], baseDir, 'html attribute');
  }
}

function checkResourcesCatalog() {
  const relPath = 'v3/resources-catalog.js';
  const text = read(relPath);
  const baseDir = path.join(ROOT, 'v3');
  const propRe = /\b(heroImage|href)\s*:\s*['"]([^'"]*)['"]/g;
  let match;

  while ((match = propRe.exec(text)) !== null) {
    const prop = match[1];
    const value = match[2];
    if (isExternalOrEmpty(value)) continue;

    // Sibling-project collateral links are useful locally but are not repo assets.
    const group = value.startsWith('../..') ? optional : required;
    addCheck(group, relPath, value, baseDir, prop);
  }
}

function checkTechnicalAssets() {
  const relPath = 'data/technical-assets.js';
  const text = read(relPath);
  const propRe = /\bfilePath\s*:\s*['"]([^'"]+)['"]/g;
  let match;

  while ((match = propRe.exec(text)) !== null) {
    // These paths are consumed by V3 pages, so resolve them from v3/.
    addCheck(required, relPath, match[1], V3_DIR, 'technical asset');
  }
}

function checkCityDataWarnings() {
  const relPath = 'data/city-data.js';
  const text = read(relPath);
  const propRe = /\b(icon|stormwaterSummary|summary|pdf)\s*:\s*['"]([^'"]+)['"]/g;
  let match;

  while ((match = propRe.exec(text)) !== null) {
    addCheck(optional, relPath, match[2], ROOT, match[1]);
  }
}

function evaluate(item, severity) {
  if (fs.existsSync(item.abs)) return;

  const message = `${item.source} -> ${item.ref}${item.note ? ` (${item.note})` : ''}`;
  if (severity === 'error') {
    errors.push(message);
  } else {
    warnings.push(message);
  }
}

checkHtmlFile('v3/index.html');
checkHtmlFile('v3/resources.html');
checkResourcesCatalog();
checkTechnicalAssets();
checkCityDataWarnings();

required.forEach((item) => evaluate(item, 'error'));
optional.forEach((item) => evaluate(item, 'warning'));

if (warnings.length) {
  console.warn(`Reference check warnings (${warnings.length}, non-blocking):`);
  warnings.slice(0, 20).forEach((warning) => console.warn(`  - ${warning}`));
  if (warnings.length > 20) {
    console.warn(`  ... ${warnings.length - 20} more warnings omitted`);
  }
}

if (errors.length) {
  console.error(`Reference check failed (${errors.length} missing required references):`);
  errors.forEach((error) => console.error(`  - ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Reference check passed (${required.length} required references checked).`);
}
