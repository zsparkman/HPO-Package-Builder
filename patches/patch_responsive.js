const fs = require('fs'), path = require('path');
const file = path.join(__dirname, 'HPO_Stream_Package_Builder_v9.3.0.html');
let lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');

// Find the closing } of the existing @media (max-width: 768px) block
const mediaIdx = lines.findIndex(l => l.trim() === '@media (max-width: 768px) {');
if (mediaIdx === -1) { console.error('media query not found'); process.exit(1); }
let depth = 0, mediaEnd = -1;
for (let i = mediaIdx; i < lines.length; i++) {
  for (const ch of lines[i]) { if (ch === '{') depth++; else if (ch === '}') depth--; }
  if (depth === 0 && i > mediaIdx) { mediaEnd = i; break; }
}
console.log(`@media block: lines ${mediaIdx+1}–${mediaEnd+1}`);

// Insert new rules just before the closing }
const newRules = [
  '  /* ── Params layout: stack vertically, DMA always last ── */',
  '  .params-layout { flex-direction: column; }',
  '  .params-left { grid-template-columns: 1fr; }',
  '  /* DOM order: Client Name(1), HPO(2), Rate Class(3), Budget(4) */',
  '  /* Mobile order: Client Name, Rate Class, HPO, Budget → DMA */',
  '  .params-left > .field:nth-child(1) { order: 1; }',
  '  .params-left > .field:nth-child(2) { order: 3; }',
  '  .params-left > .field:nth-child(3) { order: 2; }',
  '  .params-left > .field:nth-child(4) { order: 4; }',
];

lines.splice(mediaEnd, 0, ...newRules);
console.log('✓ Responsive rules inserted');

fs.writeFileSync(file, lines.join('\n'));
console.log('Done →', file);
