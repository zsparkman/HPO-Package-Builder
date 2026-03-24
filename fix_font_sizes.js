const fs = require('fs'), path = require('path');
const file = path.join(__dirname, 'HPO_Stream_Package_Builder_v9.3.0.html');
let lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');

let inBlock = false, fixed = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === '.rate-toggle {') inBlock = true;
  if (inBlock && lines[i].trim() === 'font-size: 12px;') {
    lines[i] = lines[i].replace('font-size: 12px;', 'font-size: 14px;');
    console.log(`✓ .rate-toggle font-size → 14px (line ${i+1})`);
    fixed++;
  }
  if (inBlock && lines[i].trim() === '}') { inBlock = false; if (fixed) break; }
}
if (!fixed) { console.error('Not found'); process.exit(1); }

fs.writeFileSync(file, lines.join('\n'));
console.log('Done →', file);
