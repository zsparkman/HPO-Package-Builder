const fs = require('fs'), path = require('path');
const file = path.join(__dirname, 'HPO_Stream_Package_Builder_v9.3.0.html');
let lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');

// ── 1. Remove border-top from .confirm-row ──
let inConfirm = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === '.confirm-row {') inConfirm = true;
  if (inConfirm && lines[i].includes('border-top:')) {
    lines.splice(i, 1);
    console.log(`✓ Removed border-top from .confirm-row (was line ${i+1})`);
    break;
  }
  if (inConfirm && lines[i].trim() === '}') inConfirm = false;
}

// ── 2. Split shared min-height rule into two separate rules ──
// Geo Targeting (child 4): larger min-height to absorb chips before expanding
// Rate Class (child 5): keep 121px (no chips)
// chip height estimate: label(23) + toggles(44) + gap(10) + select(44) + chips-margin(8) + ~3 rows chips(90) = 219px
const sharedIdx = lines.findIndex(l => l.trim() === '.params-grid > .field:nth-child(4),');
if (sharedIdx === -1) { console.error('shared min-height rule not found'); process.exit(1); }
// Find end of block (closing })
let depth = 0, blockEnd = -1;
for (let i = sharedIdx; i < lines.length; i++) {
  for (const ch of lines[i]) { if (ch === '{') depth++; else if (ch === '}') depth--; }
  if (depth === 0 && i > sharedIdx) { blockEnd = i; break; }
}
console.log(`Replacing shared min-height block lines ${sharedIdx+1}–${blockEnd+1}`);

const newRules = [
  '/* Geo Targeting: reserve space for chips so Confirm stays stable */',
  '.params-grid > .field:nth-child(4) {',
  '  min-height: 220px;',
  '}',
  '.params-grid > .field:nth-child(5) {',
  '  min-height: 121px;',
  '}',
];
lines.splice(sharedIdx, blockEnd - sharedIdx + 1, ...newRules);
console.log('✓ min-height rules split (Geo Targeting: 220px, Rate Class: 121px)');

fs.writeFileSync(file, lines.join('\n'));
console.log('Done →', file);
