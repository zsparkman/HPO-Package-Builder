const fs = require('fs'), path = require('path');
const file = path.join(__dirname, 'HPO_Stream_Package_Builder_v9.3.0.html');
let lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');

const idx = lines.findIndex(l => l.includes('grid-row: 1 / 3'));
if (idx === -1) { console.error('DMA field not found'); process.exit(1); }
lines[idx] = lines[idx].replace('grid-row: 1 / 3;', 'grid-column: 3; grid-row: 1 / 3;');
console.log(`Fixed line ${idx+1}: ${lines[idx].trim()}`);

fs.writeFileSync(file, lines.join('\n'));
console.log('Done →', file);
