const fs = require('fs'), path = require('path');
const file = path.join(__dirname, 'HPO_Stream_Package_Builder_v9.3.0.html');
let html = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
let lines = html.split('\n');

// Fix 1: wrapper div margin-bottom:0 → margin-bottom:8px (match label natural spacing)
const wrapIdx = lines.findIndex(l => l.includes('display:flex;align-items:center;justify-content:space-between;margin-bottom:0;'));
if (wrapIdx === -1) { console.error('Could not find wrapper div'); process.exit(1); }
lines[wrapIdx] = lines[wrapIdx].replace('margin-bottom:0;', 'margin-bottom:8px;');
console.log(`Fixed wrapper div margin at line ${wrapIdx + 1}`);

// Fix 2: remove margin-top:6px from dma-select (no longer needed)
const selIdx = lines.findIndex(l => l.includes('id="dma-select"') && l.includes('margin-top:6px;'));
if (selIdx === -1) { console.error('Could not find dma-select margin-top'); process.exit(1); }
lines[selIdx] = lines[selIdx].replace(' style="margin-top:6px;"', '');
console.log(`Removed margin-top from dma-select at line ${selIdx + 1}`);

// Fix 3: remove label style="margin-bottom:0;" from the DMA label (wrapper now controls spacing)
const dmaLabelIdx = lines.findIndex(l => l.includes('<label style="margin-bottom:0;">DMA Market</label>'));
if (dmaLabelIdx === -1) { console.error('Could not find DMA label'); process.exit(1); }
lines[dmaLabelIdx] = lines[dmaLabelIdx].replace('<label style="margin-bottom:0;">DMA Market</label>', '<label>DMA Market</label>');
console.log(`Fixed DMA label at line ${dmaLabelIdx + 1}`);

fs.writeFileSync(file, lines.join('\n'));

// Syntax check
const out = fs.readFileSync(file, 'utf8');
const sIdx = out.indexOf('<script>'), eIdx = out.indexOf('</script>', sIdx);
try { new Function(out.slice(sIdx + 8, eIdx)); console.log('✓ Syntax OK'); }
catch(e) { console.error('SYNTAX ERROR:', e.message); }
console.log('Done →', file);
