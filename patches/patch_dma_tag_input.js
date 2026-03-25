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
// 1. HTML: replace <select id="dma-select"> + dma-chips
//    with select (for DMA mode) + dma-tag-input (for multimarket)
// ══════════════════════════════════════════════════════
const selectIdx = lines.findIndex(l => l.includes('id="dma-select"'));
const chipsIdx  = lines.findIndex(l => l.includes('id="dma-chips"'));
if (selectIdx === -1 || chipsIdx === -1) { console.error('HTML elements not found'); process.exit(1); }
console.log(`Replacing lines ${selectIdx+1}–${chipsIdx+1}`);

lines.splice(selectIdx, chipsIdx - selectIdx + 1,
  '        <select id="dma-select"><option value="">Select DMA...</option></select>',
  '        <div class="dma-tag-input hidden" id="dma-tag-input">',
  '          <div class="dma-tag-body" id="dma-tag-body">',
  '            <input type="text" class="dma-tag-search" id="dma-tag-search" placeholder="Add DMA..." autocomplete="off" />',
  '          </div>',
  '          <button type="button" class="dma-tag-btn" id="dma-tag-btn">+</button>',
  '          <div class="dma-tag-dropdown hidden" id="dma-tag-dropdown"></div>',
  '        </div>',
);
console.log('✓ HTML updated');

// ══════════════════════════════════════════════════════
// 2. CSS: add tag input styles; update margin-top rule
// ══════════════════════════════════════════════════════
// Update the margin-top rule to include dma-tag-input
const mtIdx = lines.findIndex(l => l.trim() === '#dma-select,');
if (mtIdx !== -1) {
  lines[mtIdx] = '#dma-select,\n.dma-tag-input,';
  console.log(`✓ margin-top rule updated (line ${mtIdx+1})`);
}

// Find .dma-chips CSS block to insert tag input styles after it
const dmaChipsCssIdx = lines.findIndex(l => l.trim() === '.dma-chips {');
let dmaChipsEnd = -1, d = 0;
for (let i = dmaChipsCssIdx; i < lines.length; i++) {
  for (const ch of lines[i]) { if (ch === '{') d++; else if (ch === '}') d--; }
  if (d === 0 && i > dmaChipsCssIdx) { dmaChipsEnd = i; break; }
}
console.log(`Inserting tag input CSS after line ${dmaChipsEnd+1}`);

const newCSS = [
  '',
  '/* ── DMA Tag Input (multimarket) ── */',
  '.dma-tag-input {',
  '  position: relative;',
  '  display: flex;',
  '  align-items: flex-start;',
  '  min-height: 44px;',
  '  background: var(--bg-input);',
  '  border: 1.5px solid rgba(46,236,192,0.25);',
  '  border-radius: var(--radius-sm);',
  '  padding: 5px 44px 5px 8px;',
  '  flex-wrap: wrap;',
  '  gap: 4px;',
  '  cursor: text;',
  '  transition: border-color 0.2s, box-shadow 0.2s;',
  '}',
  '.dma-tag-input:focus-within {',
  '  border-color: var(--glow);',
  '  box-shadow: 0 0 0 3px var(--glow-soft), 0 0 12px var(--glow-soft);',
  '}',
  '.dma-tag-body {',
  '  display: flex;',
  '  flex-wrap: wrap;',
  '  align-items: center;',
  '  gap: 4px;',
  '  flex: 1;',
  '}',
  '.dma-tag-search {',
  '  background: none;',
  '  border: none;',
  '  outline: none;',
  '  color: var(--text-muted);',
  '  font-family: \'Inter\', sans-serif;',
  '  font-size: 14px;',
  '  font-weight: 500;',
  '  min-width: 80px;',
  '  flex: 1;',
  '  padding: 2px 0;',
  '  height: 30px;',
  '}',
  '.dma-tag-search::placeholder { color: var(--text-muted); }',
  '.dma-tag-btn {',
  '  position: absolute;',
  '  right: 0; top: 0; bottom: 0;',
  '  width: 40px;',
  '  background: none;',
  '  border: none;',
  '  border-left: 1px solid rgba(46,236,192,0.15);',
  '  color: var(--glow);',
  '  font-size: 22px;',
  '  font-weight: 300;',
  '  line-height: 1;',
  '  cursor: pointer;',
  '  display: flex;',
  '  align-items: center;',
  '  justify-content: center;',
  '  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;',
  '  transition: background 0.15s, color 0.15s;',
  '  flex-shrink: 0;',
  '}',
  '.dma-tag-btn:hover { background: rgba(27,200,160,0.08); color: var(--glow-bright); }',
  '.dma-tag-dropdown {',
  '  position: absolute;',
  '  top: calc(100% + 4px);',
  '  left: 0; right: 0;',
  '  background: var(--bg-panel);',
  '  border: 1.5px solid rgba(46,236,192,0.25);',
  '  border-radius: var(--radius-sm);',
  '  max-height: 200px;',
  '  overflow-y: auto;',
  '  z-index: 100;',
  '  box-shadow: 0 4px 16px rgba(0,0,0,0.3);',
  '}',
  '.dma-tag-option {',
  '  padding: 8px 12px;',
  '  font-size: 14px;',
  '  color: var(--text);',
  '  cursor: pointer;',
  '  transition: background 0.1s;',
  '}',
  '.dma-tag-option:hover { background: var(--glow-soft); color: var(--glow-bright); }',
  '.dma-tag-option.already-selected { opacity: 0.3; pointer-events: none; }',
];
lines.splice(dmaChipsEnd + 1, 0, ...newCSS);
console.log('✓ Tag input CSS inserted');

// ══════════════════════════════════════════════════════
// 3. JS: replace setupButtons
// ══════════════════════════════════════════════════════
const sbIdx = lines.findIndex(l => l.trim() === 'function setupButtons() {');
const sbEnd = findFunctionEnd(sbIdx);
console.log(`setupButtons: lines ${sbIdx+1}–${sbEnd+1}`);

const newSetupButtons = [
  'function setupButtons() {',
  "  const hpoSelect    = document.getElementById('hpo-select');",
  "  const dmaSelect    = document.getElementById('dma-select');",
  "  const dmaTagInput  = document.getElementById('dma-tag-input');",
  "  const dmaTagBody   = document.getElementById('dma-tag-body');",
  "  const dmaTagSearch = document.getElementById('dma-tag-search');",
  "  const dmaTagBtn    = document.getElementById('dma-tag-btn');",
  "  const dmaTagDrop   = document.getElementById('dma-tag-dropdown');",
  '',
  "  hpoSelect.addEventListener('change', () => {",
  "    hpoSelect.classList.toggle('has-value', !!hpoSelect.value);",
  '    checkConfirmReady();',
  '  });',
  '',
  '  // ── Render chips inside the tag input body ──',
  '  function renderTagChips() {',
  "    dmaTagBody.innerHTML = '';",
  '    selectedDmas.forEach(d => {',
  "      const chip = document.createElement('div');",
  "      chip.className = 'dma-chip';",
  "      const txt = document.createElement('span');",
  '      txt.textContent = d;',
  "      const rm  = document.createElement('span');",
  "      rm.className = 'dma-chip-remove';",
  "      rm.innerHTML  = '&times;';",
  "      rm.addEventListener('click', e => {",
  '        e.stopPropagation();',
  '        selectedDmas = selectedDmas.filter(x => x !== d);',
  '        renderTagChips();',
  '        renderDropdown(dmaTagSearch.value);',
  '        checkConfirmReady();',
  '      });',
  '      chip.appendChild(txt);',
  '      chip.appendChild(rm);',
  '      dmaTagBody.appendChild(chip);',
  '    });',
  '    // re-append search input after chips',
  '    dmaTagBody.appendChild(dmaTagSearch);',
  '  }',
  '',
  '  // ── Populate dropdown with filtered DMA list ──',
  '  function renderDropdown(filter) {',
  '    filter = (filter || \'\').toLowerCase();',
  "    dmaTagDrop.innerHTML = '';",
  '    const matches = DATA.dmas.filter(d => d.toLowerCase().includes(filter));',
  '    if (matches.length === 0) {',
  "      const empty = document.createElement('div');",
  "      empty.className = 'dma-tag-option';",
  "      empty.style.opacity = '0.4';",
  "      empty.textContent = 'No results';",
  '      dmaTagDrop.appendChild(empty);',
  '    } else {',
  '      matches.forEach(d => {',
  "        const opt = document.createElement('div');",
  "        opt.className = 'dma-tag-option' + (selectedDmas.includes(d) ? ' already-selected' : '');",
  '        opt.textContent = d;',
  "        opt.addEventListener('mousedown', e => {",
  '          e.preventDefault();',
  '          if (!selectedDmas.includes(d)) {',
  '            selectedDmas.push(d);',
  '            renderTagChips();',
  '            renderDropdown(dmaTagSearch.value);',
  '            checkConfirmReady();',
  '          }',
  '        });',
  '        dmaTagDrop.appendChild(opt);',
  '      });',
  '    }',
  '  }',
  '',
  '  function openDropdown() {',
  "    renderDropdown(dmaTagSearch.value);",
  "    dmaTagDrop.classList.remove('hidden');",
  '    dmaTagSearch.focus();',
  '  }',
  '  function closeDropdown() {',
  "    dmaTagDrop.classList.add('hidden');",
  "    dmaTagSearch.value = '';",
  '  }',
  '',
  "  dmaTagBtn.addEventListener('click', e => {",
  '    e.stopPropagation();',
  "    dmaTagDrop.classList.contains('hidden') ? openDropdown() : closeDropdown();",
  '  });',
  '',
  "  dmaTagInput.addEventListener('click', () => {",
  "    if (dmaTagDrop.classList.contains('hidden')) openDropdown();",
  '  });',
  '',
  "  dmaTagSearch.addEventListener('input', () => renderDropdown(dmaTagSearch.value));",
  '',
  "  document.addEventListener('click', e => {",
  "    if (!dmaTagInput.contains(e.target)) closeDropdown();",
  '  });',
  '',
  '  // ── Mode toggle (DMA / Multimarket / Full Footprint) ──',
  "  document.querySelectorAll('#dma-mode-toggles .rate-toggle').forEach(btn => {",
  "    btn.addEventListener('click', () => {",
  "      document.querySelectorAll('#dma-mode-toggles .rate-toggle').forEach(b => b.classList.remove('active'));",
  "      btn.classList.add('active');",
  '      selectedDmas = [];',
  '      closeDropdown();',
  '      renderTagChips();',
  "      dmaSelect.value = '';",
  "      dmaSelect.classList.remove('has-value');",
  '      const mode = btn.dataset.dmaMode;',
  "      const isMulti = mode === 'multimarket';",
  "      dmaSelect.classList.toggle('hidden', isMulti || mode === 'fullFootprint');",
  "      dmaTagInput.classList.toggle('hidden', !isMulti);",
  '      checkConfirmReady();',
  '    });',
  '  });',
  '',
  '  // ── Single DMA select ──',
  "  dmaSelect.addEventListener('change', () => {",
  "    dmaSelect.classList.toggle('has-value', !!dmaSelect.value);",
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
];
lines.splice(sbIdx, sbEnd - sbIdx + 1, ...newSetupButtons);
console.log('✓ setupButtons replaced');

// ══════════════════════════════════════════════════════
// 4. Write & syntax check
// ══════════════════════════════════════════════════════
fs.writeFileSync(file, lines.join('\n'));
const out = fs.readFileSync(file, 'utf8');
const sIdx = out.indexOf('<script>'), eIdx = out.indexOf('</script>', sIdx);
try { new Function(out.slice(sIdx + 8, eIdx)); console.log('✓ Syntax OK'); }
catch(e) { console.error('SYNTAX ERROR:', e.message); process.exit(1); }
console.log('Done →', file);
