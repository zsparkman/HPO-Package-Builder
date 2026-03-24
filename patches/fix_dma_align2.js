const fs = require('fs'), path = require('path');
const file = path.join(__dirname, 'HPO_Stream_Package_Builder_v9.3.0.html');
let lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');

// Find the DMA field block — starts at <div class="field"> before the flex wrapper
// Locate the flex wrapper line
const flexIdx = lines.findIndex(l => l.includes('justify-content:space-between') && l.includes('margin-bottom'));
if (flexIdx === -1) { console.error('flex wrapper not found'); process.exit(1); }

// The field div is 2 lines above the flex wrapper
const fieldDivIdx = flexIdx - 1;
if (!lines[fieldDivIdx].includes('<div class="field">')) {
  console.error('Expected field div at line ' + (fieldDivIdx+1) + ', got: ' + lines[fieldDivIdx]);
  process.exit(1);
}

// Lines to replace: from fieldDivIdx through the closing </select> + dma-chips div
// Current structure (relative line offsets):
//   fieldDivIdx+0:  <div class="field">
//   fieldDivIdx+1:  <div style="display:flex...margin-bottom:8px;">
//   fieldDivIdx+2:  <label style="margin-bottom:0;">DMA Market</label>
//   fieldDivIdx+3:  <label class="multimarket-label" id="multimarket-label">
//   fieldDivIdx+4:  <input type="checkbox" id="multimarket-checkbox" />
//   fieldDivIdx+5:  <span>Multimarket</span>
//   fieldDivIdx+6:  </label>
//   fieldDivIdx+7:  </div>
//   fieldDivIdx+8:  <select id="dma-select">...</select>
//   fieldDivIdx+9:  <div class="dma-chips hidden" id="dma-chips"></div>
//   fieldDivIdx+10: </div>

// Verify
console.log('Lines to replace:');
for (let i = fieldDivIdx; i <= fieldDivIdx + 10; i++) {
  console.log(`  ${i+1}: ${lines[i]}`);
}

const newBlock = [
  '      <div class="field" style="position:relative;">',
  '        <label>DMA Market</label>',
  '        <label class="multimarket-label" id="multimarket-label" style="position:absolute;top:0;right:0;margin:0;">',
  '          <input type="checkbox" id="multimarket-checkbox" />',
  '          <span>Multimarket</span>',
  '        </label>',
  '        <select id="dma-select"><option value="">Select DMA...</option></select>',
  '        <div class="dma-chips hidden" id="dma-chips"></div>',
  '      </div>',
];

lines.splice(fieldDivIdx, 11, ...newBlock);
fs.writeFileSync(file, lines.join('\n'));

const out = fs.readFileSync(file, 'utf8');
const sIdx = out.indexOf('<script>'), eIdx = out.indexOf('</script>', sIdx);
try { new Function(out.slice(sIdx + 8, eIdx)); console.log('✓ Syntax OK'); }
catch(e) { console.error('SYNTAX ERROR:', e.message); }
console.log('Done →', file);
