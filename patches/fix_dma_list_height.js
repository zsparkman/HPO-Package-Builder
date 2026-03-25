const fs = require('fs'), path = require('path');
const file = path.join(__dirname, '..', 'HPO_Stream_Package_Builder_v9.3.0.html');
let lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');

// 1. Remove fixed height from .dma-list-box, add flex:1 + min-height:0
const boxIdx = lines.findIndex(l => l.trim() === '.dma-list-box {');
if (boxIdx === -1) { console.error('dma-list-box not found'); process.exit(1); }
const heightLine = lines.findIndex((l, i) => i > boxIdx && l.trim() === 'height: 120px;');
if (heightLine === -1) { console.error('height line not found'); process.exit(1); }
lines.splice(heightLine, 1,
  '  flex: 1;',
  '  min-height: 0;',
  '  height: auto;'
);
console.log(`✓ .dma-list-box height replaced with flex:1 at line ${heightLine+1}`);

// 2. Add stretch + flex-column rules for fields 5 and 6 — insert before .dma-list-box block
//    (after the splice above, re-find boxIdx)
const boxIdx2 = lines.findIndex(l => l.trim() === '.dma-list-box {');
lines.splice(boxIdx2, 0,
  '.params-grid > .field:nth-child(5),',
  '.params-grid > .field:nth-child(6) {',
  '  align-self: stretch;',
  '  display: flex;',
  '  flex-direction: column;',
  '}',
  ''
);
console.log('✓ Fields 5+6 stretch/flex-column added');

// 3. Write & syntax check
fs.writeFileSync(file, lines.join('\n'));
const out = fs.readFileSync(file, 'utf8');
const sIdx = out.indexOf('<script>'), eIdx = out.indexOf('</script>', sIdx);
try { new Function(out.slice(sIdx + 8, eIdx)); console.log('✓ Syntax OK'); }
catch(e) { console.error('SYNTAX ERROR:', e.message); process.exit(1); }
console.log('Done →', file);
