const fs = require('fs'), path = require('path');
const file = path.join(__dirname, '..', 'HPO_Stream_Package_Builder_v9.3.0.html');
let lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');

const idx = lines.findIndex(l => l.includes('dmaTagBody.appendChild(dmaTagSearch)'));
if (idx === -1) { console.error('Not found'); process.exit(1); }

// Insert placeholder toggle just before re-appending the input
lines.splice(idx, 0, "    dmaTagSearch.placeholder = selectedDmas.length > 0 ? '' : 'Add DMA...';");
console.log(`✓ Placeholder toggle inserted at line ${idx+1}`);

fs.writeFileSync(file, lines.join('\n'));
console.log('Done →', file);
