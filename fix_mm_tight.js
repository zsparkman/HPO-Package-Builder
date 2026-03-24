const fs = require('fs'), path = require('path');
const file = path.join(__dirname, 'HPO_Stream_Package_Builder_v9.3.0.html');
let lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');

// Replace the .multimarket-label block (lines ~433-449)
let blockStart = -1, blockEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === '.multimarket-label {') { blockStart = i; }
  if (blockStart !== -1 && lines[i].trim() === '.multimarket-label input[type="checkbox"] {') {
    // find closing brace of this rule
    let j = i;
    while (j < lines.length && lines[j].trim() !== '}') j++;
    blockEnd = j;
    break;
  }
}
if (blockStart === -1 || blockEnd === -1) { console.error('block not found'); process.exit(1); }
console.log(`Replacing lines ${blockStart+1}–${blockEnd+1}`);

const newCSS = [
  '.multimarket-label {',
  '  display: flex;',
  '  align-items: center;',
  '  gap: 4px;',
  '  font-size: 10px;',
  '  font-weight: 700;',
  '  color: var(--text-dim);',
  '  text-transform: uppercase;',
  '  letter-spacing: 1px;',
  '  cursor: pointer;',
  '  white-space: nowrap;',
  '  line-height: 1;',
  '}',
  '.multimarket-label input[type="checkbox"] {',
  '  accent-color: var(--glow);',
  '  cursor: pointer;',
  '  width: 11px;',
  '  height: 11px;',
  '  flex-shrink: 0;',
  '  margin: 0;',
  '}',
];

lines.splice(blockStart, blockEnd - blockStart + 1, ...newCSS);
fs.writeFileSync(file, lines.join('\n'));

const out = fs.readFileSync(file, 'utf8');
const sIdx = out.indexOf('<script>'), eIdx = out.indexOf('</script>', sIdx);
try { new Function(out.slice(sIdx + 8, eIdx)); console.log('✓ Syntax OK'); }
catch(e) { console.error('SYNTAX ERROR:', e.message); }
console.log('Done →', file);
