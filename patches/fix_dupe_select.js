const fs = require('fs'), path = require('path');
const file = path.join(__dirname, '..', 'HPO_Stream_Package_Builder_v9.3.0.html');
let lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');

// Remove the first (no margin-top) duplicate — keep the one with margin-top:10px
const dupIdx = lines.findIndex(l =>
  l.includes('id="dma-select"') && !l.includes('margin-top')
);
if (dupIdx === -1) { console.error('Not found'); process.exit(1); }
lines.splice(dupIdx, 1);
console.log(`✓ Removed duplicate dma-select at line ${dupIdx+1}`);

fs.writeFileSync(file, lines.join('\n'));
console.log('Done →', file);
