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

// ── 1. HTML: Remove separate Live CPM field, move display into Rate Class field ──

// Remove the standalone field (lines: <div class="field">, <label>Live CPM</label>, <div ...>, </div>)
const standaloneLabelIdx = lines.findIndex(l => l.trim() === '<label>Live CPM</label>');
lines.splice(standaloneLabelIdx - 1, 4); // remove: <div class="field">, label, div, </div>
console.log(`✓ Standalone Live CPM field removed (was line ${standaloneLabelIdx})`);

// Insert live-cpm-display into Rate Class field, just before the hidden input
const hiddenInputIdx = lines.findIndex(l => l.includes('id="rate-class-value"'));
lines.splice(hiddenInputIdx, 0,
  '        <div class="live-cpm-value" id="live-cpm-display" style="margin-top:10px;">—</div>'
);
console.log(`✓ live-cpm-display moved into Rate Class field at line ${hiddenInputIdx+1}`);

// ── 2. Revert mobile CSS orders to pre-patch_live_cpm state ──
const o2 = lines.findIndex(l => l.includes('nth-child(2)') && l.includes('order: 4'));
if (o2 !== -1) { lines[o2] = "  .params-grid > .field:nth-child(2) { order: 3; } /* HPO + Season */"; console.log('✓ field 2 → order 3'); }
const o3 = lines.findIndex(l => l.includes('nth-child(3)') && l.includes('order: 5'));
if (o3 !== -1) { lines[o3] = "  .params-grid > .field:nth-child(3) { order: 4; } /* Total Budget */"; console.log('✓ field 3 → order 4'); }
const o5 = lines.findIndex(l => l.includes('nth-child(5)') && l.includes('order: 6'));
if (o5 !== -1) { lines[o5] = "  .params-grid > .field:nth-child(5) { order: 5; } /* Geo Targeting */"; console.log('✓ field 5 → order 5'); }
const o6 = lines.findIndex(l => l.includes('nth-child(6)') && l.includes('order: 7'));
if (o6 !== -1) { lines[o6] = "  .params-grid > .field:nth-child(6) { order: 6; } /* DMA List */"; console.log('✓ field 6 → order 6'); }
const o7 = lines.findIndex(l => l.includes('nth-child(7)') && l.includes('order: 3'));
if (o7 !== -1) { lines.splice(o7, 1); console.log('✓ field 7 mobile rule removed'); }

// ── 3. Update setupRateClassToggles: toggle live-cpm-display visibility ──
// When Special: hide live-cpm-display; when Standard/Political: show it
const srtIdx = lines.findIndex(l => l.trim() === 'function setupRateClassToggles() {');
const srtEnd = findFunctionEnd(srtIdx);

// Find the line that shows subPanel (Special branch)
const showSubPanel = lines.findIndex((l, i) => i > srtIdx && i < srtEnd && l.includes("subPanel.classList.remove('hidden')"));
if (showSubPanel !== -1) {
  const indent = lines[showSubPanel].match(/^(\s*)/)[1];
  lines.splice(showSubPanel + 1, 0, indent + "document.getElementById('live-cpm-display').classList.add('hidden');");
  console.log('✓ live-cpm-display hidden when Special selected');
}

// Find the line that hides subPanel (Standard/Political branch) — re-find srtEnd after splice
const srtEnd2 = findFunctionEnd(srtIdx);
const hideSubPanel = lines.findIndex((l, i) => i > srtIdx && i < srtEnd2 && l.includes("subPanel.classList.add('hidden')"));
if (hideSubPanel !== -1) {
  const indent = lines[hideSubPanel].match(/^(\s*)/)[1];
  lines.splice(hideSubPanel + 1, 0, indent + "document.getElementById('live-cpm-display').classList.remove('hidden');");
  console.log('✓ live-cpm-display shown when Standard/Political selected');
}

// ── 4. Write & syntax check ──
fs.writeFileSync(file, lines.join('\n'));
const out = fs.readFileSync(file, 'utf8');
const sIdx = out.indexOf('<script>'), eIdx = out.indexOf('</script>', sIdx);
try { new Function(out.slice(sIdx + 8, eIdx)); console.log('✓ Syntax OK'); }
catch(e) { console.error('SYNTAX ERROR:', e.message); process.exit(1); }
console.log('Done →', file);
