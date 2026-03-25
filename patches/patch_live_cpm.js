const fs = require('fs'), path = require('path');
const file = path.join(__dirname, '..', 'HPO_Stream_Package_Builder_v9.3.0.html');
let lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');

function findFunctionEnd(startIdx) {
  let depth = 0, started = false;
  for (let i = startIdx; i < lines.length; i++) {
    for (const ch of lines[i]) { if (ch === '{') { depth++; started = true; } else if (ch === '}') depth--; }
    if (started && depth === 0) return i;
  }
  return -1;
}

// ── 1. HTML: add Live CPM field after DMA List field ──
const dmaListBox = lines.findIndex(l => l.includes('id="dma-list-box"'));
// The field closes two lines later (</div> for the box, then </div> for the field)
let fieldClose = dmaListBox + 1;
while (fieldClose < lines.length && lines[fieldClose].trim() !== '</div>') fieldClose++;
lines.splice(fieldClose + 1, 0,
  '      <div class="field">',
  '        <label>Live CPM</label>',
  '        <div class="live-cpm-value" id="live-cpm-display">—</div>',
  '      </div>',
);
console.log(`✓ Live CPM HTML field inserted after line ${fieldClose+1}`);

// ── 2. CSS: add .live-cpm-value before .dma-list-box ──
const dmaListBoxCss = lines.findIndex(l => l.trim() === '.dma-list-box {');
lines.splice(dmaListBoxCss, 0,
  '.live-cpm-value {',
  '  height: 44px;',
  '  display: flex;',
  '  align-items: center;',
  '  padding: 0 14px;',
  '  background: var(--bg-input);',
  '  border: 1.5px solid rgba(46,236,192,0.25);',
  '  border-radius: var(--radius-sm);',
  '  color: var(--text);',
  "  font-family: 'Inter', sans-serif;",
  '  font-size: 18px;',
  '  font-weight: 600;',
  '}',
  '',
);
console.log('✓ .live-cpm-value CSS added');

// ── 3. Mobile CSS: shift orders, add nth-child(7) ──
const o2 = lines.findIndex(l => l.includes('nth-child(2)') && l.includes('order: 3'));
if (o2 !== -1) { lines[o2] = "  .params-grid > .field:nth-child(2) { order: 4; } /* HPO + Season */";  console.log('✓ field 2 → order 4'); }
const o3 = lines.findIndex(l => l.includes('nth-child(3)') && l.includes('order: 4'));
if (o3 !== -1) { lines[o3] = "  .params-grid > .field:nth-child(3) { order: 5; } /* Total Budget */"; console.log('✓ field 3 → order 5'); }
const o5 = lines.findIndex(l => l.includes('nth-child(5)') && l.includes('order: 5'));
if (o5 !== -1) { lines[o5] = "  .params-grid > .field:nth-child(5) { order: 6; } /* Geo Targeting */"; console.log('✓ field 5 → order 6'); }
const o6 = lines.findIndex(l => l.includes('nth-child(6)') && l.includes('order: 6'));
if (o6 !== -1) {
  lines.splice(o6, 1,
    "  .params-grid > .field:nth-child(6) { order: 7; } /* DMA List */",
    "  .params-grid > .field:nth-child(7) { order: 3; } /* Live CPM */"
  );
  console.log('✓ field 6 → order 7; field 7 → order 3');
}

// ── 4. JS: add updateLiveCpm + refreshSpecialOptions after setupRateClassToggles ──
const srtIdx = lines.findIndex(l => l.trim() === 'function setupRateClassToggles() {');
const srtEnd = findFunctionEnd(srtIdx);
lines.splice(srtEnd + 1, 0,
  '',
  'function updateLiveCpm() {',
  "  const hpo = document.getElementById('hpo-select').value;",
  "  const rc  = document.getElementById('rate-class-value').value;",
  "  const el  = document.getElementById('live-cpm-display');",
  '  if (!el) return;',
  '  const cpm = hpo && rc && DATA.live_cpm[hpo] ? DATA.live_cpm[hpo][rc] : null;',
  "  el.textContent = cpm != null ? '$' + cpm.toFixed(2) : '\u2014';",
  '}',
  '',
  'function refreshSpecialOptions() {',
  "  const hpo = document.getElementById('hpo-select').value;",
  "  const sel = document.getElementById('special-rate-select');",
  '  const cpmTable = hpo && DATA.live_cpm[hpo] ? DATA.live_cpm[hpo] : null;',
  '  Array.from(sel.options).forEach(opt => {',
  '    if (!opt.value) return;',
  '    const base = opt.value;',
  '    const cpm = cpmTable ? cpmTable[base] : null;',
  "    opt.textContent = base + (cpm != null ? ' ($' + cpm.toFixed(2) + ')' : '');",
  '  });',
  '}',
);
console.log('✓ updateLiveCpm + refreshSpecialOptions inserted');

// ── 5. Hook into setupRateClassToggles — call after each checkConfirmReady() ──
const srtIdx2 = lines.findIndex(l => l.trim() === 'function setupRateClassToggles() {');
let srtEnd2 = findFunctionEnd(srtIdx2);
for (let i = srtIdx2; i <= srtEnd2; i++) {
  if (lines[i].includes('checkConfirmReady()') && !lines[i].includes('function')) {
    const indent = lines[i].match(/^(\s*)/)[1];
    lines.splice(i + 1, 0, indent + 'updateLiveCpm();', indent + 'refreshSpecialOptions();');
    srtEnd2 += 2;
    i += 2;
  }
}
console.log('✓ hooks added in setupRateClassToggles');

// ── 6. Hook into setupButtons hpoSelect change handler ──
const hpoChangeLine = lines.findIndex(l => l.includes("hpoSelect.addEventListener('change'"));
if (hpoChangeLine !== -1) {
  for (let i = hpoChangeLine; i < hpoChangeLine + 10; i++) {
    if (lines[i].includes('checkConfirmReady()')) {
      const indent = lines[i].match(/^(\s*)/)[1];
      lines.splice(i + 1, 0, indent + 'updateLiveCpm();', indent + 'refreshSpecialOptions();');
      console.log(`✓ hooks added in setupButtons hpoSelect handler (line ${i+1})`);
      break;
    }
  }
}

// ── 7. Write & syntax check ──
fs.writeFileSync(file, lines.join('\n'));
const out = fs.readFileSync(file, 'utf8');
const sIdx = out.indexOf('<script>'), eIdx = out.indexOf('</script>', sIdx);
try { new Function(out.slice(sIdx + 8, eIdx)); console.log('✓ Syntax OK'); }
catch(e) { console.error('SYNTAX ERROR:', e.message); process.exit(1); }
console.log('Done →', file);
