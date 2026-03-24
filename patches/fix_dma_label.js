const fs = require('fs'), path = require('path');
const file = path.join(__dirname, 'HPO_Stream_Package_Builder_v9.3.0.html');
let lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');

// The label inside the flex wrapper inherits margin-bottom:8px from .field label
// but the wrapper div already owns the 8px spacing — zero out the label's own margin
const idx = lines.findIndex(l =>
  l.includes('justify-content:space-between;margin-bottom:8px;') &&
  lines[lines.indexOf(l) + 1] && lines[lines.indexOf(l) + 1].includes('<label>DMA Market</label>')
);
// simpler: just find the line with <label>DMA Market</label> inside the flex wrapper
const labelIdx = lines.findIndex(l => l.trim() === '<label>DMA Market</label>');
if (labelIdx === -1) { console.error('Could not find DMA Market label'); process.exit(1); }
lines[labelIdx] = lines[labelIdx].replace('<label>DMA Market</label>', '<label style="margin-bottom:0;">DMA Market</label>');
console.log(`Fixed DMA label margin at line ${labelIdx + 1}`);

fs.writeFileSync(file, lines.join('\n'));
const out = fs.readFileSync(file, 'utf8');
const sIdx = out.indexOf('<script>'), eIdx = out.indexOf('</script>', sIdx);
try { new Function(out.slice(sIdx + 8, eIdx)); console.log('✓ Syntax OK'); }
catch(e) { console.error('SYNTAX ERROR:', e.message); }
console.log('Done →', file);
