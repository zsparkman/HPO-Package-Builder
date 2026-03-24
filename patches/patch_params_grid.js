const fs = require('fs'), path = require('path');
const file = path.join(__dirname, 'HPO_Stream_Package_Builder_v9.3.0.html');
let lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');

// ── 1. Find both input-rows inside section-body and replace with params-grid ──
// Row 1 starts at first <div class="input-row">
const row1Start = lines.findIndex(l => l.trim() === '<div class="input-row">');
if (row1Start === -1) { console.error('Row 1 not found'); process.exit(1); }

// Row 2 ends at the </div> just before <div class="confirm-row">
const confirmIdx = lines.findIndex(l => l.includes('<div class="confirm-row">'));
if (confirmIdx === -1) { console.error('confirm-row not found'); process.exit(1); }
const row2End = confirmIdx - 1; // the </div> closing row 2

console.log(`Replacing lines ${row1Start+1}–${row2End+1}`);

const newGrid = [
  '    <div class="params-grid">',
  // ── Col 1 Row 1: Client Name ──
  '      <div class="field">',
  '        <label>Client Name</label>',
  '        <input type="text" id="client-name-input" placeholder="e.g. Acme Corp" autocomplete="off" />',
  '      </div>',
  // ── Col 2 Row 1: HPO + Season ──
  '      <div class="field">',
  '        <label>HPO + Season</label>',
  '        <select id="hpo-select"><option value="">Select HPO...</option></select>',
  '      </div>',
  // ── Col 3 Rows 1-2: DMA Market (spans both rows, expands freely) ──
  '      <div class="field" style="grid-row: 1 / 3;">',
  '        <label>DMA Market</label>',
  '        <div class="rate-class-toggles" id="dma-mode-toggles">',
  '          <button type="button" class="rate-toggle active" data-dma-mode="dma">DMA</button>',
  '          <button type="button" class="rate-toggle" data-dma-mode="multimarket">Multimarket</button>',
  '          <button type="button" class="rate-toggle" data-dma-mode="fullFootprint">Full Footprint</button>',
  '        </div>',
  '        <select id="dma-select" style="margin-top:10px;"><option value="">Select DMA...</option></select>',
  '        <div class="dma-chips hidden" id="dma-chips"></div>',
  '      </div>',
  // ── Col 1 Row 2: Rate Class ──
  '      <div class="field">',
  '        <label>Rate Class</label>',
  '        <div class="rate-class-toggles">',
  '          <button type="button" class="rate-toggle active" data-rate="Standard">Standard</button>',
  '          <button type="button" class="rate-toggle" data-rate="Political">Political</button>',
  '          <button type="button" class="rate-toggle" data-rate="Special">Special</button>',
  '        </div>',
  '        <div class="special-rate-dropdown" id="special-rate-dropdown">',
  '          <div class="special-rate-option" data-rate="Hold Co. + Horizon">Hold Co. + Horizon</div>',
  '          <div class="special-rate-option" data-rate="Canvas">Canvas</div>',
  '        </div>',
  '        <div class="special-rate-badge hidden" id="special-rate-badge">',
  '          <span class="badge-label">Selected:</span>',
  '          <span id="special-rate-badge-label"></span>',
  '        </div>',
  '        <input type="hidden" id="rate-class-value" value="Standard" />',
  '      </div>',
  // ── Col 2 Row 2: Total Budget + % Live ──
  '      <div class="field">',
  '        <div class="budget-connect">',
  '          <div class="budget-connect-main">',
  '            <label>Total Budget</label>',
  '            <input type="text" id="budget-input" placeholder="$0" />',
  '          </div>',
  '          <div class="budget-connect-pct">',
  '            <label>% Live</label>',
  '            <input type="text" id="live-pct-input" value="50%" maxlength="3" />',
  '          </div>',
  '        </div>',
  '      </div>',
  '    </div>',
];

lines.splice(row1Start, row2End - row1Start + 1, ...newGrid);
console.log('✓ HTML replaced with params-grid');

// ── 2. Add .params-grid CSS — insert after .input-row rule ──
const inputRowCssIdx = lines.findIndex(l => l.includes('.input-row {'));
if (inputRowCssIdx === -1) { console.error('.input-row CSS not found'); process.exit(1); }
// Find the closing } of .input-row
let braceDepth = 0, inputRowEnd = -1;
for (let i = inputRowCssIdx; i < lines.length; i++) {
  for (const ch of lines[i]) {
    if (ch === '{') braceDepth++;
    else if (ch === '}') braceDepth--;
  }
  if (braceDepth === 0 && i > inputRowCssIdx) { inputRowEnd = i; break; }
}
console.log(`.input-row CSS ends at line ${inputRowEnd+1}`);

const paramsGridCSS = [
  '.params-grid {',
  '  display: grid;',
  '  grid-template-columns: 1fr 1fr 1fr;',
  '  gap: 20px;',
  '  align-items: start;',
  '}',
  '',
];
lines.splice(inputRowEnd + 1, 0, ...paramsGridCSS);
console.log('✓ .params-grid CSS inserted');

// ── 3. Write & syntax check ──
fs.writeFileSync(file, lines.join('\n'));
const out = fs.readFileSync(file, 'utf8');
const sIdx = out.indexOf('<script>'), eIdx = out.indexOf('</script>', sIdx);
try { new Function(out.slice(sIdx + 8, eIdx)); console.log('✓ Syntax OK'); }
catch(e) { console.error('SYNTAX ERROR:', e.message); process.exit(1); }
console.log('Done →', file);
