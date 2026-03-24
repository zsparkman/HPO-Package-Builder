const fs = require('fs'), path = require('path');
const file = path.join(__dirname, 'HPO_Stream_Package_Builder_v9.3.0.html');
let lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');

// ── Helper: find the closing brace of a top-level function starting at lineIdx ──
function findFunctionEnd(startIdx) {
  let depth = 0, started = false;
  for (let i = startIdx; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === '{') { depth++; started = true; }
      else if (ch === '}') { depth--; }
    }
    if (started && depth === 0) return i;
  }
  return -1;
}

// ══════════════════════════════════════════════════════════════
// 1. HTML — replace DMA field with mode toggles
// ══════════════════════════════════════════════════════════════
const dmaFieldStart = lines.findIndex(l => l.trim() === '<div class="field" style="position:relative;">');
if (dmaFieldStart === -1) { console.error('DMA field not found'); process.exit(1); }
// Find its closing </div>
let depth = 0, dmaFieldEnd = -1;
for (let i = dmaFieldStart; i < lines.length; i++) {
  depth += (lines[i].match(/<div/g)||[]).length - (lines[i].match(/<\/div>/g)||[]).length;
  if (depth === 0 && i > dmaFieldStart) { dmaFieldEnd = i; break; }
}
console.log(`DMA field: lines ${dmaFieldStart+1}–${dmaFieldEnd+1}`);

const newDmaFieldHTML = [
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
];
lines.splice(dmaFieldStart, dmaFieldEnd - dmaFieldStart + 1, ...newDmaFieldHTML);
console.log('✓ HTML updated');

// ══════════════════════════════════════════════════════════════
// 2. state init — isMulti:false → dmaMode:'dma'
// ══════════════════════════════════════════════════════════════
const stateIdx = lines.findIndex(l => l.includes("let state = {") && l.includes("isMulti:false"));
if (stateIdx === -1) { console.error('state init not found'); process.exit(1); }
lines[stateIdx] = lines[stateIdx].replace('isMulti:false', "dmaMode:'dma'");
console.log(`✓ state init updated (line ${stateIdx+1})`);

// ══════════════════════════════════════════════════════════════
// 3. Insert getDmaMode() helper before checkConfirmReady
// ══════════════════════════════════════════════════════════════
const ccrIdx = lines.findIndex(l => l.trim() === 'function checkConfirmReady() {');
if (ccrIdx === -1) { console.error('checkConfirmReady not found'); process.exit(1); }
const getDmaModeHelper = [
  'function getDmaMode() {',
  "  const active = document.querySelector('#dma-mode-toggles .rate-toggle.active');",
  "  return active ? active.dataset.dmaMode : 'dma';",
  '}',
  '',
];
lines.splice(ccrIdx, 0, ...getDmaModeHelper);
console.log(`✓ getDmaMode() inserted at line ${ccrIdx+1}`);

// ══════════════════════════════════════════════════════════════
// 4. Replace checkConfirmReady body
// ══════════════════════════════════════════════════════════════
const ccrStart = lines.findIndex(l => l.trim() === 'function checkConfirmReady() {');
const ccrEnd = findFunctionEnd(ccrStart);
console.log(`checkConfirmReady: lines ${ccrStart+1}–${ccrEnd+1}`);
const newCCR = [
  'function checkConfirmReady() {',
  "  const hpo = document.getElementById('hpo-select').value;",
  "  const budget = parseBudget(document.getElementById('budget-input').value);",
  "  const clientName = document.getElementById('client-name-input').value.trim();",
  '  const dmaMode = getDmaMode();',
  "  const dmaOk = dmaMode === 'fullFootprint' ? true : dmaMode === 'multimarket' ? selectedDmas.length > 0 : !!document.getElementById('dma-select').value;",
  "  document.getElementById('btn-confirm').disabled = !(hpo && dmaOk && budget > 0 && clientName);",
  '}',
];
lines.splice(ccrStart, ccrEnd - ccrStart + 1, ...newCCR);
console.log('✓ checkConfirmReady updated');

// ══════════════════════════════════════════════════════════════
// 5. Replace setupButtons
// ══════════════════════════════════════════════════════════════
const sbStart = lines.findIndex(l => l.trim() === 'function setupButtons() {');
const sbEnd = findFunctionEnd(sbStart);
console.log(`setupButtons: lines ${sbStart+1}–${sbEnd+1}`);
const newSetupButtons = [
  'function setupButtons() {',
  "  const hpoSelect = document.getElementById('hpo-select');",
  '  hpoSelect.addEventListener(\'change\', () => {',
  '    hpoSelect.classList.toggle(\'has-value\', !!hpoSelect.value);',
  '    checkConfirmReady();',
  '  });',
  "  const dmaSelect  = document.getElementById('dma-select');",
  "  const dmaChipsEl = document.getElementById('dma-chips');",
  '',
  '  function renderDmaChips() {',
  '    dmaChipsEl.innerHTML = \'\';',
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
  '    dmaChipsEl.classList.toggle(\'hidden\', selectedDmas.length === 0);',
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
lines.splice(sbStart, sbEnd - sbStart + 1, ...newSetupButtons);
console.log('✓ setupButtons updated');

// ══════════════════════════════════════════════════════════════
// 6. Replace onConfirm
// ══════════════════════════════════════════════════════════════
const ocStart = lines.findIndex(l => l.trim() === 'function onConfirm() {');
const ocEnd = findFunctionEnd(ocStart);
console.log(`onConfirm: lines ${ocStart+1}–${ocEnd+1}`);
const newOnConfirm = [
  'function onConfirm() {',
  "  const hpo        = document.getElementById('hpo-select').value;",
  "  const rateClass  = document.getElementById('rate-class-value').value;",
  "  const budget     = parseBudget(document.getElementById('budget-input').value);",
  "  const clientName = document.getElementById('client-name-input').value.trim();",
  "  const livePct    = Math.min(99, Math.max(1, parseInt(document.getElementById('live-pct-input').value, 10) || 50)) / 100;",
  '  const dmaMode    = getDmaMode();',
  "  const dma        = dmaMode === 'multimarket' ? (selectedDmas[0] || '') : dmaMode === 'fullFootprint' ? 'Full Footprint' : document.getElementById('dma-select').value;",
  "  const dmas       = dmaMode === 'multimarket' ? [...selectedDmas] : dmaMode === 'fullFootprint' ? [] : (dma ? [dma] : []);",
  "  if (!hpo || (dmaMode !== 'fullFootprint' && dmas.length === 0) || budget <= 0 || !clientName) return;",
  '',
  '  const hpoData = DATA.hpos.find(h => h.name === hpo);',
  '  const cpmTable = DATA.live_cpm[hpo];',
  '  const liveCpm = cpmTable ? cpmTable[rateClass] : undefined;',
  '  const dateData = DATA.dates[hpo];',
  '',
  '  // Cap: sum max live imps',
  '  let maxLiveImps = 0;',
  "  if (dmaMode === 'fullFootprint') {",
  "    const suffix = '|' + hpo;",
  '    const allKeys = Object.keys(DATA.max_live_imps).filter(k => k.endsWith(suffix));',
  '    if (allKeys.length === 0) { maxLiveImps = undefined; }',
  '    else { for (const k of allKeys) maxLiveImps += DATA.max_live_imps[k]; }',
  '  } else {',
  '    for (const d of dmas) {',
  "      const v = DATA.max_live_imps[d + '|' + hpo];",
  '      if (v === undefined) { maxLiveImps = undefined; break; }',
  '      maxLiveImps += v;',
  '    }',
  '  }',
  '',
  '  if (liveCpm === undefined) {',
  "    showValidation('err', 'No Live CPM found for \"' + hpo + '\" + \"' + rateClass + '\". Check asset data.');",
  "    document.getElementById('results-section').classList.remove('hidden');",
  "    document.getElementById('generate-section').classList.add('hidden');",
  '    return;',
  '  }',
  '',
  '  const liveBudget    = budget * livePct;',
  '  const supportBudget = budget * (1 - livePct);',
  '  const liveImps      = Math.round((liveBudget / liveCpm) * 1000);',
  '',
  "  state = { ...state, hpo, dma, dmas, dmaMode, budget, rateClass, clientName, livePct, liveCpm, liveImps, liveBudget, supportBudget,",
  '    maxLiveImps: maxLiveImps !== undefined ? maxLiveImps : null,',
  "    liveDates:    dateData ? dateData.live_range    : 'N/A',",
  "    supportDates: dateData ? dateData.support_range : 'N/A',",
  "    sport: hpoData ? hpoData.sport : '',",
  '    packages: {}, confirmed: true,',
  '  };',
  '',
  '  let valid = true;',
  '  if (maxLiveImps !== undefined && liveImps > maxLiveImps) {',
  '    const maxBudget = Math.floor((maxLiveImps * liveCpm / 1000) * 2);',
  "    const capLabel = dmaMode === 'dma' ? dma : dmaMode === 'fullFootprint' ? 'full footprint' : 'combined markets';",
  "    showValidation('err', 'Budget too large: ' + fmt(liveImps) + ' live imps exceeds cap of ' + fmt(maxLiveImps) + ' for ' + capLabel + '. Max budget: $' + fmt(maxBudget) + '.');",
  '    valid = false;',
  '  } else if (maxLiveImps === undefined) {',
  "    const missingLabel = dmaMode === 'fullFootprint' ? 'full footprint' : dmaMode === 'multimarket' ? 'one or more selected markets' : dma + ' + ' + hpo;",
  "    showValidation('warn', 'No max imps data for ' + missingLabel + '. Proceeding without cap check.');",
  '  } else {',
  "    showValidation('ok', 'Within cap: ' + fmt(liveImps) + ' / ' + fmt(maxLiveImps) + ' live imps (' + Math.round(liveImps/maxLiveImps*100) + '%)');",
  '  }',
  '',
  "  document.getElementById('r-cpm').textContent    = '$' + fmt(liveCpm);",
  "  document.getElementById('r-imps').textContent   = fmt(liveImps);",
  "  document.getElementById('r-invest').textContent = '$' + fmt(liveBudget);",
  "  document.getElementById('r-dates').textContent  = state.liveDates;",
  "  document.getElementById('results-hpo-badge').textContent = hpo + ' \u00b7 ' + rateClass;",
  '',
  "  const row = document.getElementById('packages-row');",
  '  row.innerHTML = \'\';',
  '  for (const pkg of ASSET_CONFIG.packages) {',
  '    const supportCpmTable = DATA.live_cpm[pkg.cpmKey];',
  '    const pkgCpm = supportCpmTable ? (supportCpmTable[rateClass] || 0) : 0;',
  '    const supportImps = pkgCpm > 0 ? Math.round((supportBudget / pkgCpm) * 1000) : 0;',
  '    const totalInvestment = budget;',
  '    const totalImps = liveImps + supportImps;',
  '    const eCpm = totalImps > 0 ? (totalInvestment / totalImps) * 1000 : 0;',
  '    state.packages[pkg.name] = { cpm: pkgCpm, supportImps, totalInvestment, totalImps, eCpm };',
  "    const card = document.createElement('div');",
  "    card.className = 'pkg-card';",
  "    card.innerHTML = '<div class=\"pkg-head\"><h4>Option ' + (ASSET_CONFIG.packages.indexOf(pkg)+1) + '</h4><div class=\"sub\">' + pkg.label + '</div></div>'",
  "      + '<div class=\"pkg-body\">'",
  "      + '<div class=\"pkg-row\"><span class=\"k\">Support Dates</span><span class=\"v\" style=\"font-size:11px;\">' + state.supportDates + '</span></div>'",
  "      + '<div class=\"pkg-row\"><span class=\"k\">CPM</span><span class=\"v\">$' + pkgCpm + '</span></div>'",
  "      + '<div class=\"pkg-row\"><span class=\"k\">Support Imps</span><span class=\"v\">' + fmt(supportImps) + '</span></div>'",
  "      + '<div class=\"pkg-divider\"></div>'",
  "      + '<div class=\"pkg-row\"><span class=\"k\">Total Investment</span><span class=\"v\">$' + fmt(totalInvestment) + '</span></div>'",
  "      + '<div class=\"pkg-row\"><span class=\"k\">Total Imps</span><span class=\"v\">' + fmt(totalImps) + '</span></div>'",
  "      + '<div class=\"pkg-row\"><span class=\"k\">eCPM</span><span class=\"v\">$' + eCpm.toFixed(2) + '</span></div>'",
  "      + '</div>';",
  '    row.appendChild(card);',
  '  }',
  '',
  "  document.getElementById('results-section').classList.remove('hidden');",
  '  if (valid || maxLiveImps === undefined) {',
  "    document.getElementById('generate-section').classList.remove('hidden');",
  "    document.getElementById('expected-tpl').textContent = ASSET_CONFIG.template_pattern.replace('{hpo}', hpo);",
  '    if (EMBEDDED_TEMPLATES[hpo] || EMBEDDED_MASTER_TEMPLATE) {',
  '      loadEmbeddedTemplate(hpo).then(zip => {',
  '        if (zip) {',
  '          state.templateZip = zip;',
  "          state.templateFile = { name: ASSET_CONFIG.template_pattern.replace('{hpo}', hpo) };",
  "          document.getElementById('file-drop-wrap').classList.add('hidden');",
  "          document.getElementById('tpl-loaded-wrap').classList.remove('hidden');",
  '          const srcLabel = EMBEDDED_TEMPLATES[hpo] ? hpo : \'Master Template\';',
  "          document.getElementById('loaded-name').textContent = state.templateFile.name + ' (' + srcLabel + ' embedded)';",
  '        }',
  '      }).catch(e => console.warn(\'Embedded template load failed:\', e));',
  '    }',
  '    updateReplacementsPreview();',
  '  } else {',
  "    document.getElementById('generate-section').classList.add('hidden');",
  '  }',
  "  document.getElementById('results-section').scrollIntoView({ behavior: 'smooth', block: 'start' });",
  '}',
];
lines.splice(ocStart, ocEnd - ocStart + 1, ...newOnConfirm);
console.log('✓ onConfirm updated');

// ══════════════════════════════════════════════════════════════
// 7. getReplacementPlan — update 'XXX DMA' line
// ══════════════════════════════════════════════════════════════
const rpIdx = lines.findIndex(l => l.includes("find: 'XXX DMA'") && l.includes('isMulti'));
if (rpIdx === -1) { console.error('XXX DMA replacement line not found'); process.exit(1); }
lines[rpIdx] = "      { find: 'XXX DMA', replace: state.dmaMode === 'fullFootprint' ? 'Full Footprint' : state.dmaMode === 'multimarket' ? 'Multimarket' : state.dma + ' DMA' },";
console.log(`✓ getReplacementPlan updated (line ${rpIdx+1})`);

// ══════════════════════════════════════════════════════════════
// 8. Filename generation
// ══════════════════════════════════════════════════════════════
const fnIdx = lines.findIndex(l => l.includes("state.isMulti ? state.hpo + ' - Multimarket") && l.includes('.pptx'));
if (fnIdx === -1) { console.error('filename line not found'); process.exit(1); }
lines[fnIdx] = "    const name = (state.dmaMode === 'fullFootprint' ? state.hpo + ' - Full Footprint - ' + state.clientName : state.dmaMode === 'multimarket' ? state.hpo + ' - Multimarket - ' + state.clientName : state.hpo + ' - ' + state.dma + ' - ' + state.clientName) + '.pptx';";
console.log(`✓ filename updated (line ${fnIdx+1})`);

// ══════════════════════════════════════════════════════════════
// Write & syntax check
// ══════════════════════════════════════════════════════════════
fs.writeFileSync(file, lines.join('\n'));
const out = fs.readFileSync(file, 'utf8');
const sIdx = out.indexOf('<script>'), eIdx = out.indexOf('</script>', sIdx);
try { new Function(out.slice(sIdx + 8, eIdx)); console.log('✓ Syntax OK'); }
catch(e) { console.error('SYNTAX ERROR:', e.message); process.exit(1); }
console.log('Done →', file);
