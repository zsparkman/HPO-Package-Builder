const fs = require('fs'), path = require('path');
const file = path.join(__dirname, '..', 'HPO_Stream_Package_Builder_v9.3.0.html');
let lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');

// ── 1. Add updateDmaAvailability() after populateDMAs() ──
const popDMAsIdx = lines.findIndex(l => l.trim() === 'function populateDMAs() {');
// find the end (single-line body, ends at closing brace on same or next line)
let popDMAsEnd = popDMAsIdx;
let depth = 0;
for (let i = popDMAsIdx; i < lines.length; i++) {
  for (const ch of lines[i]) { if (ch === '{') depth++; else if (ch === '}') depth--; }
  if (depth === 0 && i >= popDMAsIdx) { popDMAsEnd = i; break; }
}
lines.splice(popDMAsEnd + 1, 0,
  '',
  'function updateDmaAvailability() {',
  "  const hpo = document.getElementById('hpo-select').value;",
  "  const sel = document.getElementById('dma-select');",
  '  Array.from(sel.options).forEach(opt => {',
  '    if (!opt.value) return;',
  "    const hasData = !hpo || DATA.max_live_imps[opt.value + '|' + hpo] !== undefined;",
  '    opt.disabled = !hasData;',
  "    opt.style.color = hasData ? '' : 'rgba(255,255,255,0.2)';",
  '  });',
  '}',
);
console.log(`✓ updateDmaAvailability inserted after line ${popDMAsEnd+1}`);

// ── 2. Call updateDmaAvailability() in hpoSelect change handler ──
const hpoChangeLine = lines.findIndex(l => l.includes("hpoSelect.addEventListener('change'"));
for (let i = hpoChangeLine; i < hpoChangeLine + 12; i++) {
  if (lines[i].includes('checkConfirmReady()')) {
    const indent = lines[i].match(/^(\s*)/)[1];
    lines.splice(i + 1, 0, indent + 'updateDmaAvailability();');
    console.log(`✓ updateDmaAvailability hooked into hpoSelect change (line ${i+2})`);
    break;
  }
}

// ── 3. Full Footprint: filter to DMAs with data only ──
const ffLine = lines.findIndex(l => l.includes("selectedDmas = mode === 'fullFootprint' ? [...DATA.dmas] :"));
if (ffLine !== -1) {
  const indent = lines[ffLine].match(/^(\s*)/)[1];
  lines[ffLine] = indent + "selectedDmas = mode === 'fullFootprint'" +
    "\n" + indent + "  ? DATA.dmas.filter(d => DATA.max_live_imps[d + '|' + document.getElementById('hpo-select').value] !== undefined)" +
    "\n" + indent + "  : [];";
  console.log(`✓ Full Footprint filtered to available DMAs (line ${ffLine+1})`);
}

// ── 4. Write & syntax check ──
fs.writeFileSync(file, lines.join('\n'));
const out = fs.readFileSync(file, 'utf8');
const sIdx = out.indexOf('<script>'), eIdx = out.indexOf('</script>', sIdx);
try { new Function(out.slice(sIdx + 8, eIdx)); console.log('✓ Syntax OK'); }
catch(e) { console.error('SYNTAX ERROR:', e.message); process.exit(1); }
console.log('Done →', file);
