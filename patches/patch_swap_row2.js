const fs = require('fs'), path = require('path');
const file = path.join(__dirname, '..', 'HPO_Stream_Package_Builder_v9.3.0.html');
let lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');

// Find Geo Targeting field (child 4) and Rate Class field (child 5) in params-grid
// Geo Targeting starts with <label>Geo Targeting</label>
const geoStart = lines.findIndex(l => l.trim() === '<label>Geo Targeting</label>') - 1;
let depth = 0, geoEnd = -1;
for (let i = geoStart; i < lines.length; i++) {
  depth += (lines[i].match(/<div/g)||[]).length - (lines[i].match(/<\/div>/g)||[]).length;
  if (depth === 0 && i > geoStart) { geoEnd = i; break; }
}

const rateStart = geoEnd + 1;
let depth2 = 0, rateEnd = -1;
for (let i = rateStart; i < lines.length; i++) {
  depth2 += (lines[i].match(/<div/g)||[]).length - (lines[i].match(/<\/div>/g)||[]).length;
  if (depth2 === 0 && i > rateStart) { rateEnd = i; break; }
}

console.log(`Geo Targeting: lines ${geoStart+1}–${geoEnd+1}`);
console.log(`Rate Class:    lines ${rateStart+1}–${rateEnd+1}`);

// Extract both blocks and swap them
const geoBlock  = lines.slice(geoStart, geoEnd + 1);
const rateBlock = lines.slice(rateStart, rateEnd + 1);

lines.splice(geoStart, rateEnd - geoStart + 1, ...rateBlock, ...geoBlock);
console.log('✓ Swapped: Rate Class now child 4, Geo Targeting now child 5');

// Update mobile CSS order values to match new order:
// child 4 = Rate Class → order: 2 (was order: 5)
// child 5 = Geo Targeting → order: 5 (was order: 2)
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('nth-child(4)') && lines[i].includes('order: 5')) {
    lines[i] = lines[i].replace('order: 5', 'order: 2').replace('Geo Targeting — always last', 'Rate Class');
    console.log(`✓ Mobile order fixed for child 4 (line ${i+1})`);
  }
  if (lines[i].includes('nth-child(5)') && lines[i].includes('order: 2')) {
    lines[i] = lines[i].replace('order: 2', 'order: 5').replace('Rate Class', 'Geo Targeting — always last');
    console.log(`✓ Mobile order fixed for child 5 (line ${i+1})`);
  }
}

fs.writeFileSync(file, lines.join('\n'));
const out = fs.readFileSync(file, 'utf8');
const sIdx = out.indexOf('<script>'), eIdx = out.indexOf('</script>', sIdx);
try { new Function(out.slice(sIdx + 8, eIdx)); console.log('✓ Syntax OK'); }
catch(e) { console.error('SYNTAX ERROR:', e.message); process.exit(1); }
console.log('Done →', file);
