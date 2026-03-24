const fs = require('fs'), path = require('path');
const file = path.join(__dirname, 'HPO_Stream_Package_Builder_v9.3.0.html');
let lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');

// ── 1. Swap HTML: Rate Class ↔ DMA Market ──
const layoutStart = lines.findIndex(l => l.trim() === '<div class="params-layout">');
if (layoutStart === -1) { console.error('params-layout not found'); process.exit(1); }
let depth = 0, layoutEnd = -1;
for (let i = layoutStart; i < lines.length; i++) {
  depth += (lines[i].match(/<div/g)||[]).length - (lines[i].match(/<\/div>/g)||[]).length;
  if (depth === 0 && i > layoutStart) { layoutEnd = i; break; }
}
console.log(`params-layout: lines ${layoutStart+1}–${layoutEnd+1}`);

const newLayout = [
  '    <div class="params-layout">',
  '      <div class="params-left">',
  // Row 1 Col 1: Client Name
  '        <div class="field">',
  '          <label>Client Name</label>',
  '          <input type="text" id="client-name-input" placeholder="e.g. Acme Corp" autocomplete="off" />',
  '        </div>',
  // Row 1 Col 2: HPO + Season
  '        <div class="field">',
  '          <label>HPO + Season</label>',
  '          <select id="hpo-select"><option value="">Select HPO...</option></select>',
  '        </div>',
  // Row 2 Col 1: DMA Market (swapped in)
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
  // Row 2 Col 2: Total Budget + % Live
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
  // Right column: Rate Class (swapped in — expands freely without shifting row 2)
  '      <div class="params-right">',
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
  '      </div>',
  '    </div>',
];
lines.splice(layoutStart, layoutEnd - layoutStart + 1, ...newLayout);
console.log('✓ HTML swapped');

// ── 2. Update mobile responsive CSS ──
// Replace the existing params rules inside @media (max-width: 768px)
const mediaIdx = lines.findIndex(l => l.trim() === '@media (max-width: 768px) {');
if (mediaIdx === -1) { console.error('media query not found'); process.exit(1); }
let mDepth = 0, mediaEnd = -1;
for (let i = mediaIdx; i < lines.length; i++) {
  for (const ch of lines[i]) { if (ch === '{') mDepth++; else if (ch === '}') mDepth--; }
  if (mDepth === 0 && i > mediaIdx) { mediaEnd = i; break; }
}
console.log(`@media block: lines ${mediaIdx+1}–${mediaEnd+1}`);

// Remove existing params-related lines from the media block
// and rebuild the whole block cleanly
const mediaLines = lines.slice(mediaIdx + 1, mediaEnd);
const filteredMedia = mediaLines.filter(l =>
  !l.includes('params-') && !l.trim().startsWith('/*')
);

const newMediaBlock = [
  '@media (max-width: 768px) {',
  ...filteredMedia,
  '  /* ── Params: stack vertically; display:contents flattens nested containers ── */',
  '  /* Mobile order: Client Name → Rate Class → HPO → Budget → DMA Market */',
  '  .params-layout { flex-direction: column; }',
  '  .params-left, .params-right { display: contents; }',
  '  .params-left > .field:nth-child(1) { order: 1; } /* Client Name */',
  '  .params-left > .field:nth-child(2) { order: 3; } /* HPO + Season */',
  '  .params-left > .field:nth-child(3) { order: 5; } /* DMA Market — always last */',
  '  .params-left > .field:nth-child(4) { order: 4; } /* Total Budget */',
  '  .params-right > .field { order: 2; }              /* Rate Class */',
  '}',
];
lines.splice(mediaIdx, mediaEnd - mediaIdx + 1, ...newMediaBlock);
console.log('✓ Mobile CSS updated');

// ── 3. Write & syntax check ──
fs.writeFileSync(file, lines.join('\n'));
const out = fs.readFileSync(file, 'utf8');
const sIdx = out.indexOf('<script>'), eIdx = out.indexOf('</script>', sIdx);
try { new Function(out.slice(sIdx + 8, eIdx)); console.log('✓ Syntax OK'); }
catch(e) { console.error('SYNTAX ERROR:', e.message); process.exit(1); }
console.log('Done →', file);
