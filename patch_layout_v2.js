const fs = require('fs'), path = require('path');
const file = path.join(__dirname, 'HPO_Stream_Package_Builder_v9.3.0.html');
let lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');

function findBlockEnd(startIdx) {
  let depth = 0;
  for (let i = startIdx; i < lines.length; i++) {
    for (const ch of lines[i]) { if (ch === '{') depth++; else if (ch === '}') depth--; }
    if (depth === 0 && i > startIdx) return i;
  }
  return -1;
}

// ═══════════════════════════════════════════════════════════
// 1. Remove params-layout / params-left / params-right CSS
// ═══════════════════════════════════════════════════════════
// They're on consecutive lines 236-251 — find and remove all three blocks
for (let pass = 0; pass < 3; pass++) {
  const idx = lines.findIndex(l => /^\.(params-layout|params-left|params-right) \{/.test(l.trim()));
  if (idx === -1) break;
  const end = findBlockEnd(idx);
  lines.splice(idx, end - idx + 1);
  console.log(`✓ Removed ${lines[idx] || 'params CSS block'} (was line ${idx+1})`);
}

// ═══════════════════════════════════════════════════════════
// 2. Replace special-rate CSS blocks with .special-sub-toggles
// ═══════════════════════════════════════════════════════════
// Remove: .special-rate-dropdown, .special-rate-dropdown.open, @keyframes fadeSlideIn,
//         .special-rate-option, .special-rate-option:hover, .special-rate-option.selected,
//         .special-rate-badge, .special-rate-badge .badge-label
// Insert: .special-sub-toggles { margin-top: 8px; }
const specialStart = lines.findIndex(l => l.trim() === '.special-rate-dropdown {');
if (specialStart === -1) { console.error('.special-rate-dropdown not found'); process.exit(1); }
// Find end of .special-rate-badge .badge-label block
const badgeLabelIdx = lines.findIndex(l => l.trim() === '.special-rate-badge .badge-label {');
const badgeLabelEnd = findBlockEnd(badgeLabelIdx);
console.log(`Replacing special-rate CSS lines ${specialStart+1}–${badgeLabelEnd+1}`);

const newSpecialCSS = [
  '.special-sub-toggles {',
  '  margin-top: 8px;',
  '}',
];
lines.splice(specialStart, badgeLabelEnd - specialStart + 1, ...newSpecialCSS);
console.log('✓ special-rate CSS replaced with .special-sub-toggles');

// ═══════════════════════════════════════════════════════════
// 3. Replace HTML: params-layout → params-grid, new field order,
//    special-rate-dropdown → sub-toggles
// ═══════════════════════════════════════════════════════════
const layoutStart = lines.findIndex(l => l.includes('<div class="params-layout">'));
if (layoutStart === -1) { console.error('params-layout HTML not found'); process.exit(1); }
let htmlDepth = 0, layoutEnd = -1;
for (let i = layoutStart; i < lines.length; i++) {
  htmlDepth += (lines[i].match(/<div/g)||[]).length - (lines[i].match(/<\/div>/g)||[]).length;
  if (htmlDepth === 0 && i > layoutStart) { layoutEnd = i; break; }
}
console.log(`params-layout HTML: lines ${layoutStart+1}–${layoutEnd+1}`);

const newHTML = [
  '    <div class="params-grid">',
  // ── Row 1, Col 1: Client Name ──
  '      <div class="field">',
  '        <label>Client Name</label>',
  '        <input type="text" id="client-name-input" placeholder="e.g. Acme Corp" autocomplete="off" />',
  '      </div>',
  // ── Row 1, Col 2: HPO + Season ──
  '      <div class="field">',
  '        <label>HPO + Season</label>',
  '        <select id="hpo-select"><option value="">Select HPO...</option></select>',
  '      </div>',
  // ── Row 1, Col 3: Total Budget + % Live ──
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
  // ── Row 2, Col 1: DMA Market ──
  '      <div class="field">',
  '        <label>DMA Market</label>',
  '        <div class="rate-class-toggles" id="dma-mode-toggles">',
  '          <button type="button" class="rate-toggle active" data-dma-mode="dma">DMA</button>',
  '          <button type="button" class="rate-toggle" data-dma-mode="multimarket">Multimarket</button>',
  '          <button type="button" class="rate-toggle" data-dma-mode="fullFootprint">Full Footprint</button>',
  '        </div>',
  '        <select id="dma-select" style="margin-top:10px;"><option value="">Select DMA...</option></select>',
  '        <div class="dma-chips hidden" id="dma-chips"></div>',
  '      </div>',
  // ── Row 2, Col 2: Rate Class (sub-toggles instead of dropdown) ──
  '      <div class="field">',
  '        <label>Rate Class</label>',
  '        <div class="rate-class-toggles" id="rate-class-toggles">',
  '          <button type="button" class="rate-toggle active" data-rate="Standard">Standard</button>',
  '          <button type="button" class="rate-toggle" data-rate="Political">Political</button>',
  '          <button type="button" class="rate-toggle" data-rate="Special">Special</button>',
  '        </div>',
  '        <div class="special-sub-toggles hidden" id="special-sub-toggles">',
  '          <div class="rate-class-toggles">',
  '            <button type="button" class="rate-toggle" data-special="Hold Co. + Horizon">Hold Co. + Horizon</button>',
  '            <button type="button" class="rate-toggle" data-special="Canvas">Canvas</button>',
  '          </div>',
  '        </div>',
  '        <input type="hidden" id="rate-class-value" value="Standard" />',
  '      </div>',
  // ── Row 2, Col 3: empty ──
  '    </div>',
];
lines.splice(layoutStart, layoutEnd - layoutStart + 1, ...newHTML);
console.log('✓ HTML replaced');

// ═══════════════════════════════════════════════════════════
// 4. Replace setupRateClassToggles JS
// ═══════════════════════════════════════════════════════════
const srtIdx = lines.findIndex(l => l.trim() === 'function setupRateClassToggles() {');
if (srtIdx === -1) { console.error('setupRateClassToggles not found'); process.exit(1); }
let depth = 0, srtEnd = -1;
for (let i = srtIdx; i < lines.length; i++) {
  for (const ch of lines[i]) { if (ch === '{') depth++; else if (ch === '}') depth--; }
  if (depth === 0 && i > srtIdx) { srtEnd = i; break; }
}
console.log(`setupRateClassToggles: lines ${srtIdx+1}–${srtEnd+1}`);

const newSetupRate = [
  'function setupRateClassToggles() {',
  "  const toggles    = document.querySelectorAll('#rate-class-toggles .rate-toggle');",
  "  const subPanel   = document.getElementById('special-sub-toggles');",
  "  const subToggles = subPanel.querySelectorAll('.rate-toggle');",
  "  const hiddenInput = document.getElementById('rate-class-value');",
  '',
  '  toggles.forEach(toggle => {',
  "    toggle.addEventListener('click', () => {",
  '      toggles.forEach(t => t.classList.remove(\'active\'));',
  "      toggle.classList.add('active');",
  '      const rate = toggle.dataset.rate;',
  "      if (rate === 'Special') {",
  "        subPanel.classList.remove('hidden');",
  '        // Auto-select first sub-option if none active',
  "        if (!subPanel.querySelector('.rate-toggle.active')) {",
  "          subToggles[0].classList.add('active');",
  '          hiddenInput.value = subToggles[0].dataset.special;',
  '        }',
  '      } else {',
  "        subPanel.classList.add('hidden');",
  "        subToggles.forEach(t => t.classList.remove('active'));",
  '        hiddenInput.value = rate;',
  '      }',
  '      checkConfirmReady();',
  '    });',
  '  });',
  '',
  '  subToggles.forEach(toggle => {',
  "    toggle.addEventListener('click', () => {",
  "      subToggles.forEach(t => t.classList.remove('active'));",
  "      toggle.classList.add('active');",
  '      hiddenInput.value = toggle.dataset.special;',
  '      checkConfirmReady();',
  '    });',
  '  });',
  '}',
];
lines.splice(srtIdx, srtEnd - srtIdx + 1, ...newSetupRate);
console.log('✓ setupRateClassToggles replaced');

// ═══════════════════════════════════════════════════════════
// 5. Update mobile responsive CSS
// ═══════════════════════════════════════════════════════════
const mediaIdx = lines.findIndex(l => l.trim() === '@media (max-width: 768px) {');
if (mediaIdx === -1) { console.error('media query not found'); process.exit(1); }
let mDepth = 0, mediaEnd = -1;
for (let i = mediaIdx; i < lines.length; i++) {
  for (const ch of lines[i]) { if (ch === '{') mDepth++; else if (ch === '}') mDepth--; }
  if (mDepth === 0 && i > mediaIdx) { mediaEnd = i; break; }
}
// Remove old params-* rules from media block, rebuild
const keepLines = lines.slice(mediaIdx + 1, mediaEnd).filter(l =>
  !l.includes('params-') && !l.trim().startsWith('/*')
);
const newMedia = [
  '@media (max-width: 768px) {',
  ...keepLines,
  '  /* ── params-grid: stack to single column ── */',
  '  /* Mobile order: Client Name → Rate Class → HPO → Budget → DMA Market */',
  '  .params-grid { grid-template-columns: 1fr; }',
  '  .params-grid > .field:nth-child(1) { order: 1; } /* Client Name */',
  '  .params-grid > .field:nth-child(2) { order: 3; } /* HPO + Season */',
  '  .params-grid > .field:nth-child(3) { order: 4; } /* Total Budget */',
  '  .params-grid > .field:nth-child(4) { order: 5; } /* DMA Market — always last */',
  '  .params-grid > .field:nth-child(5) { order: 2; } /* Rate Class */',
  '}',
];
lines.splice(mediaIdx, mediaEnd - mediaIdx + 1, ...newMedia);
console.log('✓ Mobile CSS updated');

// ═══════════════════════════════════════════════════════════
// 6. Write & syntax check
// ═══════════════════════════════════════════════════════════
fs.writeFileSync(file, lines.join('\n'));
const out = fs.readFileSync(file, 'utf8');
const sIdx = out.indexOf('<script>'), eIdx = out.indexOf('</script>', sIdx);
try { new Function(out.slice(sIdx + 8, eIdx)); console.log('✓ Syntax OK'); }
catch(e) { console.error('SYNTAX ERROR:', e.message); process.exit(1); }
console.log('Done →', file);
