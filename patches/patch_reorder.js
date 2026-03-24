const fs = require('fs'), path = require('path');
const file = path.join(__dirname, 'HPO_Stream_Package_Builder_v9.3.0.html');
let lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');

// Find the two-row block: starts at first <div class="input-row"> inside section-body
// ends at the closing </div> of the second row (before <div class="confirm-row">)
const row1Start = lines.findIndex(l => l === '    <div class="input-row">');

// Find closing of second row (the one with inline style)
const row2Start = lines.findIndex((l, i) => i > row1Start && l.includes('input-row') && l.includes('margin-top'));
let divDepth = 0, row2End = -1;
for (let i = row2Start; i < lines.length; i++) {
  divDepth += (lines[i].match(/<div/g)||[]).length - (lines[i].match(/<\/div>/g)||[]).length;
  if (divDepth === 0 && i > row2Start) { row2End = i; break; }
}
console.log(`Replacing lines ${row1Start+1}–${row2End+1}`);

const newRows = [
  // ── Row 1: Client Name | HPO + Season | DMA Market (3 cols) ──
  '    <div class="input-row">',
  '      <div class="field">',
  '        <label>Client Name</label>',
  '        <input type="text" id="client-name-input" placeholder="e.g. Acme Corp" autocomplete="off" />',
  '      </div>',
  '      <div class="field">',
  '        <label>HPO + Season</label>',
  '        <select id="hpo-select"><option value="">Select HPO...</option></select>',
  '      </div>',
  '      <div class="field">',
  '        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0;">',
  '          <label style="margin-bottom:0;">DMA Market</label>',
  '          <label class="multimarket-label" id="multimarket-label">',
  '            <input type="checkbox" id="multimarket-checkbox" />',
  '            <span>Multimarket</span>',
  '          </label>',
  '        </div>',
  '        <select id="dma-select" style="margin-top:6px;"><option value="">Select DMA...</option></select>',
  '        <div class="dma-chips hidden" id="dma-chips"></div>',
  '      </div>',
  '    </div>',
  // ── Row 2: Rate Class | Total Budget+%Live (use same 3-col grid; col 3 empty) ──
  '    <div class="input-row" style="margin-top:20px;">',
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

lines.splice(row1Start, row2End - row1Start + 1, ...newRows);
fs.writeFileSync(file, lines.join('\n'));

// Syntax check
const html = fs.readFileSync(file, 'utf8');
const sIdx = html.indexOf('<script>'), eIdx = html.indexOf('</script>', sIdx);
try { new Function(html.slice(sIdx + 8, eIdx)); console.log('✓ Syntax OK'); }
catch(e) { console.error('SYNTAX ERROR:', e.message); }
console.log('Done →', file);
