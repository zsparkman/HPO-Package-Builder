const fs = require('fs'), path = require('path');
const file = path.join(__dirname, 'HPO_Stream_Package_Builder_v9.3.0.html');
let lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');

let inBlock = false, targetIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('.params-grid {')) inBlock = true;
  if (inBlock && lines[i].trim() === 'align-items: start;') { targetIdx = i; break; }
  if (inBlock && lines[i].trim() === '}') inBlock = false;
}
if (targetIdx === -1) { console.error('Not found'); process.exit(1); }

lines.splice(targetIdx + 1, 0, '  padding-bottom: 54px;');
console.log(`✓ Added padding-bottom: 54px after line ${targetIdx + 1}`);

fs.writeFileSync(file, lines.join('\n'));
console.log('Done →', file);
