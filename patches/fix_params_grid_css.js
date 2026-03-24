const fs = require('fs'), path = require('path');
const file = path.join(__dirname, 'HPO_Stream_Package_Builder_v9.3.0.html');
let lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');

// Find the blank line after .input-row closing } and insert .params-grid there
const inputRowIdx = lines.findIndex(l => l.trim() === '.input-row {');
let depth = 0, inputRowEnd = -1;
for (let i = inputRowIdx; i < lines.length; i++) {
  for (const ch of lines[i]) { if (ch === '{') depth++; else if (ch === '}') depth--; }
  if (depth === 0 && i > inputRowIdx) { inputRowEnd = i; break; }
}
console.log(`.input-row ends at line ${inputRowEnd+1}`);

const newCSS = [
  '',
  '.params-grid {',
  '  display: grid;',
  '  grid-template-columns: 1fr 1fr 1fr;',
  '  gap: 20px;',
  '  align-items: start;',
  '}',
];
lines.splice(inputRowEnd + 1, 0, ...newCSS);
console.log('✓ .params-grid base CSS restored');

fs.writeFileSync(file, lines.join('\n'));
console.log('Done →', file);
