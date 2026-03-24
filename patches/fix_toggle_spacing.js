const fs = require('fs'), path = require('path');
const file = path.join(__dirname, 'HPO_Stream_Package_Builder_v9.3.0.html');
let lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');

// 1. Remove inline margin-top from dma-select
const dmaIdx = lines.findIndex(l => l.includes('id="dma-select"') && l.includes('margin-top:10px;'));
if (dmaIdx === -1) { console.error('dma-select not found'); process.exit(1); }
lines[dmaIdx] = lines[dmaIdx].replace(' style="margin-top:10px;"', '');
console.log(`✓ Removed inline margin-top from dma-select (line ${dmaIdx+1})`);

// 2. Equalize .special-sub-toggles margin-top to match, and add #dma-select rule
const subIdx = lines.findIndex(l => l.trim() === '.special-sub-toggles {');
if (subIdx === -1) { console.error('.special-sub-toggles not found'); process.exit(1); }
// Replace the block with combined rule covering both
let depth = 0, subEnd = -1;
for (let i = subIdx; i < lines.length; i++) {
  for (const ch of lines[i]) { if (ch === '{') depth++; else if (ch === '}') depth--; }
  if (depth === 0 && i > subIdx) { subEnd = i; break; }
}
lines.splice(subIdx, subEnd - subIdx + 1,
  '#dma-select,',
  '.special-sub-toggles {',
  '  margin-top: 10px;',
  '}'
);
console.log(`✓ Equalized spacing to 10px for both`);

fs.writeFileSync(file, lines.join('\n'));
console.log('Done →', file);
