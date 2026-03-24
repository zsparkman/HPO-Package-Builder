const fs = require('fs'), path = require('path');
const file = path.join(__dirname, 'HPO_Stream_Package_Builder_v9.3.0.html');
let lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');

// ── 1. Replace .params-grid CSS with new layout CSS ──
const pgCssIdx = lines.findIndex(l => l.trim() === '.params-grid {');
if (pgCssIdx === -1) { console.error('.params-grid CSS not found'); process.exit(1); }
let pgCssEnd = pgCssIdx;
let depth = 0;
for (let i = pgCssIdx; i < lines.length; i++) {
  for (const ch of lines[i]) { if (ch === '{') depth++; else if (ch === '}') depth--; }
  if (depth === 0 && i > pgCssIdx) { pgCssEnd = i; break; }
}
console.log(`.params-grid CSS: lines ${pgCssIdx+1}–${pgCssEnd+1}`);

const newCSS = [
  '.params-layout {',
  '  display: flex;',
  '  gap: 20px;',
  '  align-items: flex-start;',
  '}',
  '.params-left {',
  '  flex: 2;',
  '  display: grid;',
  '  grid-template-columns: 1fr 1fr;',
  '  gap: 20px;',
  '  align-items: start;',
  '}',
  '.params-right {',
  '  flex: 1;',
  '}',
];
lines.splice(pgCssIdx, pgCssEnd - pgCssIdx + 1, ...newCSS);
console.log('✓ CSS updated');

// ── 2. Replace .params-grid HTML with new layout HTML ──
const gridHtmlIdx = lines.findIndex(l => l.trim() === '<div class="params-grid">');
if (gridHtmlIdx === -1) { console.error('.params-grid HTML not found'); process.exit(1); }
// Find its closing </div>
let htmlDepth = 0, gridHtmlEnd = -1;
for (let i = gridHtmlIdx; i < lines.length; i++) {
  htmlDepth += (lines[i].match(/<div/g)||[]).length - (lines[i].match(/<\/div>/g)||[]).length;
  if (htmlDepth === 0 && i > gridHtmlIdx) { gridHtmlEnd = i; break; }
}
console.log(`params-grid HTML: lines ${gridHtmlIdx+1}–${gridHtmlEnd+1}`);

const newHTML = [
  '    <div class="params-layout">',
  '      <div class="params-left">',
  // Row 1, Col 1: Client Name
  '        <div class="field">',
  '          <label>Client Name</label>',
  '          <input type="text" id="client-name-input" placeholder="e.g. Acme Corp" autocomplete="off" />',
  '        </div>',
  // Row 1, Col 2: HPO + Season
  '        <div class="field">',
  '          <label>HPO + Season</label>',
  '          <select id="hpo-select"><option value="">Select HPO...</option></select>',
  '        </div>',
  // Row 2, Col 1: Rate Class
  '        <div class="field">',
  '          <label>Rate Class</label>',
  '          <div class="rate-class-toggles">',
  '            <button type="button" class="rate-toggle active" data-rate="Standard">Standard</button>',
  '            <button type="button" class="rate-toggle" data-rate="Political">Political</button>',
  '            <button type="button" class="rate-toggle" data-rate="Special">Special</button>',
  '          </div>',
  '          <div class="special-rate-dropdown" id="special-rate-dropdown">',
  '            <div class="special-rate-option" data-rate="Hold Co. + Horizon">Hold Co. + Horizon</div>',
  '            <div class="special-rate-option" data-rate="Canvas">Canvas</div>',
  '          </div>',
  '          <div class="special-rate-badge hidden" id="special-rate-badge">',
  '            <span class="badge-label">Selected:</span>',
  '            <span id="special-rate-badge-label"></span>',
  '          </div>',
  '          <input type="hidden" id="rate-class-value" value="Standard" />',
  '        </div>',
  // Row 2, Col 2: Total Budget + % Live
  '        <div class="field">',
  '          <div class="budget-connect">',
  '            <div class="budget-connect-main">',
  '              <label>Total Budget</label>',
  '              <input type="text" id="budget-input" placeholder="$0" />',
  '            </div>',
  '            <div class="budget-connect-pct">',
  '              <label>% Live</label>',
  '              <input type="text" id="live-pct-input" value="50%" maxlength="3" />',
  '            </div>',
  '          </div>',
  '        </div>',
  '      </div>',
  // Right column: DMA Market — completely independent, expands freely
  '      <div class="params-right">',
  '        <div class="field">',
  '          <label>DMA Market</label>',
  '          <div class="rate-class-toggles" id="dma-mode-toggles">',
  '            <button type="button" class="rate-toggle active" data-dma-mode="dma">DMA</button>',
  '            <button type="button" class="rate-toggle" data-dma-mode="multimarket">Multimarket</button>',
  '            <button type="button" class="rate-toggle" data-dma-mode="fullFootprint">Full Footprint</button>',
  '          </div>',
  '          <select id="dma-select" style="margin-top:10px;"><option value="">Select DMA...</option></select>',
  '          <div class="dma-chips hidden" id="dma-chips"></div>',
  '        </div>',
  '      </div>',
  '    </div>',
];
lines.splice(gridHtmlIdx, gridHtmlEnd - gridHtmlIdx + 1, ...newHTML);
console.log('✓ HTML updated');

// ── 3. Write & syntax check ──
fs.writeFileSync(file, lines.join('\n'));
const out = fs.readFileSync(file, 'utf8');
const sIdx = out.indexOf('<script>'), eIdx = out.indexOf('</script>', sIdx);
try { new Function(out.slice(sIdx + 8, eIdx)); console.log('✓ Syntax OK'); }
catch(e) { console.error('SYNTAX ERROR:', e.message); process.exit(1); }
console.log('Done →', file);
