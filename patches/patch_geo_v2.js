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

// ══════════════════════════════════════════════════════
// 1. HTML — replace Geo Targeting field + add DMA List col
// ══════════════════════════════════════════════════════
const geoStart = lines.findIndex(l => l.trim() === '<label>Geo Targeting</label>') - 1;
let depth = 0, geoEnd = -1;
for (let i = geoStart; i < lines.length; i++) {
  depth += (lines[i].match(/<div/g)||[]).length - (lines[i].match(/<\/div>/g)||[]).length;
  if (depth === 0 && i > geoStart) { geoEnd = i; break; }
}
console.log(`Geo Targeting field: lines ${geoStart+1}–${geoEnd+1}`);

lines.splice(geoStart, geoEnd - geoStart + 1,
  '      <div class="field">',
  '        <label>Geo Targeting</label>',
  '        <div class="rate-class-toggles" id="dma-mode-toggles">',
  '          <button type="button" class="rate-toggle active" data-dma-mode="dma">DMA</button>',
  '          <button type="button" class="rate-toggle" data-dma-mode="fullFootprint">Full Footprint</button>',
  '        </div>',
  '        <select id="dma-select" style="margin-top:10px;"><option value="">Add DMA...</option></select>',
  '      </div>',
  // New DMA List column (col 3 of row 2)
  '      <div class="field">',
  '        <label>DMA List</label>',
  '        <div class="dma-list-box" id="dma-list-box"></div>',
  '      </div>',
);
console.log('✓ HTML updated');

// ══════════════════════════════════════════════════════
// 2. CSS — add .dma-list-box; update mobile order for child 6
// ══════════════════════════════════════════════════════
// Insert .dma-list-box after .dma-chips block
const dmaChipsEnd = (() => {
  const start = lines.findIndex(l => l.trim() === '.dma-chips {');
  let d = 0;
  for (let i = start; i < lines.length; i++) {
    for (const ch of lines[i]) { if (ch === '{') d++; else if (ch === '}') d--; }
    if (d === 0 && i > start) return i;
  }
})();
lines.splice(dmaChipsEnd + 1, 0,
  '',
  '.dma-list-box {',
  '  height: 120px;',
  '  overflow-y: auto;',
  '  background: var(--bg-input);',
  '  border: 1.5px solid rgba(46,236,192,0.25);',
  '  border-radius: var(--radius-sm);',
  '  padding: 6px 8px;',
  '  display: flex;',
  '  flex-wrap: wrap;',
  '  align-content: flex-start;',
  '  gap: 4px;',
  '  transition: border-color 0.2s;',
  '}',
);
console.log('✓ .dma-list-box CSS inserted');

// Add child 6 to mobile CSS
const mediaIdx = lines.findIndex(l => l.trim() === '@media (max-width: 768px) {');
const lastChildLine = lines.findIndex(l => l.includes('nth-child(5)') && l.includes('order: 5'));
if (lastChildLine !== -1) {
  lines.splice(lastChildLine + 1, 0,
    "  .params-grid > .field:nth-child(6) { order: 6; } /* DMA List */"
  );
  console.log('✓ Mobile CSS updated');
}

// ══════════════════════════════════════════════════════
// 3. JS — checkConfirmReady
// ══════════════════════════════════════════════════════
const ccrIdx = lines.findIndex(l => l.trim() === 'function checkConfirmReady() {');
const ccrEnd = findFunctionEnd(ccrIdx);
lines.splice(ccrIdx, ccrEnd - ccrIdx + 1,
  'function checkConfirmReady() {',
  "  const hpo = document.getElementById('hpo-select').value;",
  "  const budget = parseBudget(document.getElementById('budget-input').value);",
  "  const clientName = document.getElementById('client-name-input').value.trim();",
  '  const dmaOk = selectedDmas.length > 0;',
  "  document.getElementById('btn-confirm').disabled = !(hpo && dmaOk && budget > 0 && clientName);",
  '}',
);
console.log('✓ checkConfirmReady updated');

// ══════════════════════════════════════════════════════
// 4. JS — setupButtons
// ══════════════════════════════════════════════════════
const sbIdx = lines.findIndex(l => l.trim() === 'function setupButtons() {');
const sbEnd = findFunctionEnd(sbIdx);
lines.splice(sbIdx, sbEnd - sbIdx + 1,
  'function setupButtons() {',
  "  const hpoSelect  = document.getElementById('hpo-select');",
  "  const dmaSelect  = document.getElementById('dma-select');",
  "  const dmaListBox = document.getElementById('dma-list-box');",
  '',
  "  hpoSelect.addEventListener('change', () => {",
  "    hpoSelect.classList.toggle('has-value', !!hpoSelect.value);",
  '    checkConfirmReady();',
  '  });',
  '',
  '  function setMode(mode) {',
  "    document.querySelectorAll('#dma-mode-toggles .rate-toggle').forEach(b => {",
  "      b.classList.toggle('active', b.dataset.dmaMode === mode);",
  '    });',
  "    dmaSelect.classList.toggle('hidden', mode === 'fullFootprint');",
  '  }',
  '',
  '  function renderList() {',
  "    dmaListBox.innerHTML = '';",
  '    selectedDmas.forEach(d => {',
  "      const chip = document.createElement('div');",
  "      chip.className = 'dma-chip';",
  "      const txt = document.createElement('span');",
  '      txt.textContent = d;',
  "      const rm = document.createElement('span');",
  "      rm.className = 'dma-chip-remove';",
  "      rm.innerHTML = '&times;';",
  "      rm.addEventListener('click', () => {",
  "        if (getDmaMode() === 'fullFootprint') setMode('dma');",
  '        selectedDmas = selectedDmas.filter(x => x !== d);',
  '        renderList();',
  '        checkConfirmReady();',
  '      });',
  '      chip.appendChild(txt);',
  '      chip.appendChild(rm);',
  '      dmaListBox.appendChild(chip);',
  '    });',
  '  }',
  '',
  "  document.querySelectorAll('#dma-mode-toggles .rate-toggle').forEach(btn => {",
  "    btn.addEventListener('click', () => {",
  '      const mode = btn.dataset.dmaMode;',
  '      setMode(mode);',
  "      if (mode === 'fullFootprint') {",
  '        selectedDmas = [...DATA.dmas];',
  '      } else {',
  '        selectedDmas = [];',
  '      }',
  "      dmaSelect.value = '';",
  "      dmaSelect.classList.remove('has-value');",
  '      renderList();',
  '      checkConfirmReady();',
  '    });',
  '  });',
  '',
  "  dmaSelect.addEventListener('change', () => {",
  '    const val = dmaSelect.value;',
  '    if (val && !selectedDmas.includes(val)) {',
  '      selectedDmas.push(val);',
  '      renderList();',
  '    }',
  "    dmaSelect.value = '';",
  "    dmaSelect.classList.remove('has-value');",
  '    checkConfirmReady();',
  '  });',
  '',
  "  document.getElementById('client-name-input').addEventListener('input', e => {",
  "    e.target.classList.toggle('has-value', !!e.target.value.trim());",
  '    checkConfirmReady();',
  '  });',
  "  document.getElementById('btn-confirm').addEventListener('click', onConfirm);",
  "  document.getElementById('btn-generate').addEventListener('click', generatePptx);",
  '}',
);
console.log('✓ setupButtons updated');

// ══════════════════════════════════════════════════════
// 5. JS — onConfirm (dma/dmas/guard/cap/labels)
// ══════════════════════════════════════════════════════
// Patch the specific lines inside onConfirm rather than replacing the whole function
const dmaLine = lines.findIndex(l => l.includes("dmaMode === 'multimarket' ? (selectedDmas[0]"));
if (dmaLine !== -1) {
  lines[dmaLine] = "  const dma        = dmaMode === 'fullFootprint' ? 'Full Footprint' : selectedDmas[0] || '';";
  console.log(`✓ onConfirm dma line updated (${dmaLine+1})`);
}
const dmasLine = lines.findIndex(l => l.includes("dmaMode === 'multimarket' ? [...selectedDmas]"));
if (dmasLine !== -1) {
  lines[dmasLine] = "  const dmas       = [...selectedDmas];";
  console.log(`✓ onConfirm dmas line updated (${dmasLine+1})`);
}
const guardLine = lines.findIndex(l => l.includes("dmaMode !== 'fullFootprint' && dmas.length === 0"));
if (guardLine !== -1) {
  lines[guardLine] = "  if (!hpo || selectedDmas.length === 0 || budget <= 0 || !clientName) return;";
  console.log(`✓ onConfirm guard updated (${guardLine+1})`);
}
// Cap section — replace fullFootprint branch
const capFPLine = lines.findIndex(l => l.trim() === "if (dmaMode === 'fullFootprint') {");
if (capFPLine !== -1) {
  // Find end of the if/else block
  let d2 = 0, capEnd = -1;
  for (let i = capFPLine; i < lines.length; i++) {
    for (const ch of lines[i]) { if (ch === '{') d2++; else if (ch === '}') d2--; }
    if (d2 === 0 && i > capFPLine) { capEnd = i; break; }
  }
  lines.splice(capFPLine, capEnd - capFPLine + 1,
    '  for (const d of selectedDmas) {',
    "    const v = DATA.max_live_imps[d + '|' + hpo];",
    '    if (v === undefined) { maxLiveImps = undefined; break; }',
    '    maxLiveImps += v;',
    '  }',
  );
  console.log('✓ Cap calculation simplified');
}
// capLabel and missingLabel
const capLabelLine = lines.findIndex(l => l.includes("dmaMode === 'dma' ? dma :"));
if (capLabelLine !== -1) {
  lines[capLabelLine] = "    const capLabel = dmaMode === 'fullFootprint' ? 'full footprint' : selectedDmas.length > 1 ? 'combined markets' : dma;";
  console.log(`✓ capLabel updated (${capLabelLine+1})`);
}
const missingLine = lines.findIndex(l => l.includes("dmaMode === 'fullFootprint' ? 'full footprint' : dmaMode === 'multimarket'"));
if (missingLine !== -1) {
  lines[missingLine] = "    const missingLabel = dmaMode === 'fullFootprint' ? 'full footprint' : selectedDmas.length > 1 ? 'one or more selected markets' : dma + ' + ' + hpo;";
  console.log(`✓ missingLabel updated (${missingLine+1})`);
}

// ══════════════════════════════════════════════════════
// 6. getReplacementPlan — XXX DMA
// ══════════════════════════════════════════════════════
const rpLine = lines.findIndex(l => l.includes("find: 'XXX DMA'"));
if (rpLine !== -1) {
  lines[rpLine] = "      { find: 'XXX DMA', replace: state.dmaMode === 'fullFootprint' ? 'Full Footprint' : state.dmas.length > 1 ? 'Multimarket' : state.dma + ' DMA' },";
  console.log(`✓ getReplacementPlan updated (${rpLine+1})`);
}

// ══════════════════════════════════════════════════════
// 7. Filename
// ══════════════════════════════════════════════════════
const fnLine = lines.findIndex(l => l.includes("state.dmaMode === 'fullFootprint'") && l.includes('.pptx'));
if (fnLine !== -1) {
  lines[fnLine] = "    const name = (state.dmaMode === 'fullFootprint' ? state.hpo + ' - Full Footprint - ' + state.clientName : state.dmas.length > 1 ? state.hpo + ' - Multimarket - ' + state.clientName : state.hpo + ' - ' + state.dma + ' - ' + state.clientName) + '.pptx';";
  console.log(`✓ Filename updated (${fnLine+1})`);
}

// ══════════════════════════════════════════════════════
// 8. Write & syntax check
// ══════════════════════════════════════════════════════
fs.writeFileSync(file, lines.join('\n'));
const out = fs.readFileSync(file, 'utf8');
const sIdx = out.indexOf('<script>'), eIdx = out.indexOf('</script>', sIdx);
try { new Function(out.slice(sIdx + 8, eIdx)); console.log('✓ Syntax OK'); }
catch(e) { console.error('SYNTAX ERROR:', e.message); process.exit(1); }
console.log('Done →', file);
