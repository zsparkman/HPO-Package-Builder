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

const sbIdx = lines.findIndex(l => l.trim() === 'function setupButtons() {');
const sbEnd = findFunctionEnd(sbIdx);
console.log(`setupButtons: lines ${sbIdx+1}–${sbEnd+1}`);

lines.splice(sbIdx, sbEnd - sbIdx + 1,
  'function setupButtons() {',
  "  const hpoSelect  = document.getElementById('hpo-select');",
  "  const dmaSelect  = document.getElementById('dma-select');",
  "  const dmaListBox = document.getElementById('dma-list-box');",
  '',
  "  hpoSelect.addEventListener('change', () => {",
  "    hpoSelect.classList.toggle('has-value', !!hpoSelect.value);",
  '    checkConfirmReady();',
  '    updateLiveCpm();',
  '    refreshSpecialOptions();',
  '  });',
  '',
  '  function setMode(mode) {',
  "    document.querySelectorAll('#dma-mode-toggles .rate-toggle').forEach(b => {",
  "      b.classList.toggle('active', b.dataset.dmaMode === mode);",
  '    });',
  '  }',
  '',
  '  function renderOptions() {',
  '    Array.from(dmaSelect.options).forEach(opt => {',
  '      if (!opt.value) return;',
  '      opt.textContent = (selectedDmas.includes(opt.value) ? \'\u2713 \' : \'\') + opt.value;',
  '    });',
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
  '    renderOptions();',
  '  }',
  '',
  "  document.querySelectorAll('#dma-mode-toggles .rate-toggle').forEach(btn => {",
  "    btn.addEventListener('click', () => {",
  '      const mode = btn.dataset.dmaMode;',
  '      setMode(mode);',
  "      selectedDmas = mode === 'fullFootprint' ? [...DATA.dmas] : [];",
  "      dmaSelect.value = '';",
  "      dmaSelect.classList.remove('has-value');",
  '      renderList();',
  '      checkConfirmReady();',
  '    });',
  '  });',
  '',
  "  dmaSelect.addEventListener('change', () => {",
  '    const val = dmaSelect.value;',
  '    if (val) {',
  '      if (selectedDmas.includes(val)) {',
  "        if (getDmaMode() === 'fullFootprint') setMode('dma');",
  '        selectedDmas = selectedDmas.filter(x => x !== val);',
  '      } else {',
  '        selectedDmas.push(val);',
  '      }',
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
console.log('✓ setupButtons replaced');

fs.writeFileSync(file, lines.join('\n'));
const out = fs.readFileSync(file, 'utf8');
const sIdx = out.indexOf('<script>'), eIdx = out.indexOf('</script>', sIdx);
try { new Function(out.slice(sIdx + 8, eIdx)); console.log('✓ Syntax OK'); }
catch(e) { console.error('SYNTAX ERROR:', e.message); process.exit(1); }
console.log('Done →', file);
