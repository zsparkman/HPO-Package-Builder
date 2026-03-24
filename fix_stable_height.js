const fs = require('fs'), path = require('path');
const file = path.join(__dirname, 'HPO_Stream_Package_Builder_v9.3.0.html');
let lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');

// 1. Remove padding-bottom: 54px from .params-grid
let inBlock = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('.params-grid {')) inBlock = true;
  if (inBlock && lines[i].trim() === 'padding-bottom: 54px;') {
    lines.splice(i, 1);
    console.log(`✓ Removed padding-bottom from .params-grid (was line ${i+1})`);
    break;
  }
  if (inBlock && lines[i].trim() === '}') inBlock = false;
}

// 2. Add min-height rule for bottom-row fields (children 4 and 5 of .params-grid)
//    Expanded height: label(23px) + toggles(44px) + gap(10px) + select(44px) = 121px
const insertAfterPattern = '.params-grid {';
const pgIdx = lines.findIndex(l => l.trim() === '.params-grid {');
let pgEnd = -1, d = 0;
for (let i = pgIdx; i < lines.length; i++) {
  for (const ch of lines[i]) { if (ch === '{') d++; else if (ch === '}') d--; }
  if (d === 0 && i > pgIdx) { pgEnd = i; break; }
}
const newRule = [
  '',
  '.params-grid > .field:nth-child(4),',
  '.params-grid > .field:nth-child(5) {',
  '  min-height: 121px;',
  '}',
];
lines.splice(pgEnd + 1, 0, ...newRule);
console.log(`✓ Added min-height: 121px for bottom-row fields after line ${pgEnd+1}`);

fs.writeFileSync(file, lines.join('\n'));
console.log('Done →', file);
