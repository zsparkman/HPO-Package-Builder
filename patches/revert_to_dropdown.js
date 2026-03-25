const fs = require('fs'), path = require('path');
const file = path.join(__dirname, '..', 'HPO_Stream_Package_Builder_v9.3.0.html');
let lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');

function findBlockEnd(startIdx) {
  let depth = 0;
  for (let i = startIdx; i < lines.length; i++) {
    for (const ch of lines[i]) { if (ch === '{') depth++; else if (ch === '}') depth--; }
    if (depth === 0 && i > startIdx) return i;
  }
  return -1;
}
function findFunctionEnd(startIdx) {
  let depth = 0, started = false;
  for (let i = startIdx; i < lines.length; i++) {
    for (const ch of lines[i]) { if (ch === '{') { depth++; started = true; } else if (ch === '}') depth--; }
    if (started && depth === 0) return i;
  }
  return -1;
}

// ── 1. Revert HTML: remove dma-tag-input div, restore dma-chips div ──
const selectIdx = lines.findIndex(l => l.includes('id="dma-select"'));
const tagInputStart = lines.findIndex(l => l.includes('<div class="dma-tag-input hidden"'));
let tagInputEnd = -1, depth = 0;
for (let i = tagInputStart; i < lines.length; i++) {
  depth += (lines[i].match(/<div/g)||[]).length - (lines[i].match(/<\/div>/g)||[]).length;
  if (depth === 0 && i > tagInputStart) { tagInputEnd = i; break; }
}
console.log(`Tag input HTML: lines ${tagInputStart+1}–${tagInputEnd+1}`);
lines.splice(tagInputStart, tagInputEnd - tagInputStart + 1,
  '        <select id="dma-select" style="margin-top:10px;"><option value="">Select DMA...</option></select>',
  '        <div class="dma-chips hidden" id="dma-chips"></div>'
);
console.log('✓ HTML reverted');

// ── 2. Remove dma-tag-input from margin-top rule ──
const mtIdx = lines.findIndex(l => l.trim() === '.dma-tag-input,');
if (mtIdx !== -1) { lines.splice(mtIdx, 1); console.log('✓ margin-top rule cleaned'); }

// ── 3. Remove all tag input CSS blocks ──
// Remove: comment + .dma-tag-input, :focus-within, .dma-tag-body, .dma-tag-search,
//         ::placeholder, .dma-tag-btn, :hover, .dma-tag-dropdown, .dma-tag-option,
//         :hover, .already-selected, .dma-tag-input .dma-chip override
const removeStartComment = lines.findIndex(l => l.includes('DMA Tag Input (multimarket)'));
if (removeStartComment !== -1) {
  const chipOverrideIdx = lines.findIndex(l => l.trim() === '.dma-tag-input .dma-chip {');
  const chipOverrideEnd = findBlockEnd(chipOverrideIdx);
  lines.splice(removeStartComment - 1, chipOverrideEnd - removeStartComment + 2);
  console.log('✓ Tag input CSS removed');
}

// ── 4. Restore setupButtons ──
const sbIdx = lines.findIndex(l => l.trim() === 'function setupButtons() {');
const sbEnd = findFunctionEnd(sbIdx);
console.log(`setupButtons: lines ${sbIdx+1}–${sbEnd+1}`);

const newSetupButtons = [
  'function setupButtons() {',
  "  const hpoSelect = document.getElementById('hpo-select');",
  '  hpoSelect.addEventListener(\'change\', () => {',
  "    hpoSelect.classList.toggle('has-value', !!hpoSelect.value);",
  '    checkConfirmReady();',
  '  });',
  "  const dmaSelect  = document.getElementById('dma-select');",
  "  const dmaChipsEl = document.getElementById('dma-chips');",
  '',
  '  function renderDmaChips() {',
  "    dmaChipsEl.innerHTML = '';",
  '    selectedDmas.forEach(d => {',
  "      const chip = document.createElement('div');",
  "      chip.className = 'dma-chip';",
  "      const txt = document.createElement('span');",
  '      txt.textContent = d;',
  "      const rm = document.createElement('span');",
  "      rm.className = 'dma-chip-remove';",
  "      rm.innerHTML = '&times;';",
  '      rm.addEventListener(\'click\', () => {',
  '        selectedDmas = selectedDmas.filter(x => x !== d);',
  '        renderDmaChips();',
  '        checkConfirmReady();',
  '      });',
  '      chip.appendChild(txt);',
  '      chip.appendChild(rm);',
  '      dmaChipsEl.appendChild(chip);',
  '    });',
  "    dmaChipsEl.classList.toggle('hidden', selectedDmas.length === 0);",
  '  }',
  '',
  "  document.querySelectorAll('#dma-mode-toggles .rate-toggle').forEach(btn => {",
  '    btn.addEventListener(\'click\', () => {',
  "      document.querySelectorAll('#dma-mode-toggles .rate-toggle').forEach(b => b.classList.remove('active'));",
  "      btn.classList.add('active');",
  '      selectedDmas = [];',
  '      renderDmaChips();',
  "      dmaSelect.value = '';",
  "      dmaSelect.classList.remove('has-value');",
  '      const mode = btn.dataset.dmaMode;',
  "      dmaSelect.classList.toggle('hidden', mode === 'fullFootprint');",
  "      dmaSelect.options[0].text = mode === 'multimarket' ? 'Add DMA...' : 'Select DMA...';",
  '      checkConfirmReady();',
  '    });',
  '  });',
  '',
  '  dmaSelect.addEventListener(\'change\', () => {',
  '    const mode = getDmaMode();',
  "    if (mode === 'multimarket') {",
  '      const val = dmaSelect.value;',
  '      if (val && !selectedDmas.includes(val)) {',
  '        selectedDmas.push(val);',
  '        renderDmaChips();',
  '      }',
  "      dmaSelect.value = '';",
  "      dmaSelect.classList.remove('has-value');",
  '    } else {',
  "      dmaSelect.classList.toggle('has-value', !!dmaSelect.value);",
  '    }',
  '    checkConfirmReady();',
  '  });',
  '',
  "  document.getElementById('client-name-input').addEventListener('input', e => { e.target.classList.toggle('has-value', !!e.target.value.trim()); checkConfirmReady(); });",
  "  document.getElementById('btn-confirm').addEventListener('click', onConfirm);",
  "  document.getElementById('btn-generate').addEventListener('click', generatePptx);",
  '}',
];
lines.splice(sbIdx, sbEnd - sbIdx + 1, ...newSetupButtons);
console.log('✓ setupButtons restored');

// ── 5. Write & syntax check ──
fs.writeFileSync(file, lines.join('\n'));
const out = fs.readFileSync(file, 'utf8');
const sIdx = out.indexOf('<script>'), eIdx = out.indexOf('</script>', sIdx);
try { new Function(out.slice(sIdx + 8, eIdx)); console.log('✓ Syntax OK'); }
catch(e) { console.error('SYNTAX ERROR:', e.message); process.exit(1); }
console.log('Done →', file);
