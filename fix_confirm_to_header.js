const fs = require('fs'), path = require('path');
const file = path.join(__dirname, 'HPO_Stream_Package_Builder_v9.3.0.html');
let lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');

// ── 1. Move btn-confirm into section-header, remove confirm-row ──
// Find section 1 header line
const hdrIdx = lines.findIndex((l, i) =>
  l.trim() === '<div class="section-header">' &&
  lines[i+1] && lines[i+1].includes('step-num">1')
);
if (hdrIdx === -1) { console.error('section 1 header not found'); process.exit(1); }
// Find its closing </div>
let depth = 0, hdrEnd = -1;
for (let i = hdrIdx; i < lines.length; i++) {
  depth += (lines[i].match(/<div/g)||[]).length - (lines[i].match(/<\/div>/g)||[]).length;
  if (depth === 0 && i > hdrIdx) { hdrEnd = i; break; }
}
console.log(`Section 1 header: lines ${hdrIdx+1}–${hdrEnd+1}`);

// Replace header with button added at the end (margin-left:auto pushes it right)
const oldHeader = lines.slice(hdrIdx, hdrEnd + 1);
const newHeader = [
  '  <div class="section-header">',
  '    <span class="step-num">1</span>',
  '    <h2>Select Parameters</h2>',
  '    <button class="btn btn-primary" id="btn-confirm" disabled style="margin-left:auto;">Confirm Selection</button>',
  '  </div>',
];
lines.splice(hdrIdx, hdrEnd - hdrIdx + 1, ...newHeader);
console.log('✓ btn-confirm moved to section header');

// ── 2. Remove the confirm-row div from section-body ──
const confirmRowIdx = lines.findIndex(l => l.trim() === '<div class="confirm-row">');
if (confirmRowIdx === -1) { console.error('confirm-row not found'); process.exit(1); }
let crDepth = 0, confirmRowEnd = -1;
for (let i = confirmRowIdx; i < lines.length; i++) {
  crDepth += (lines[i].match(/<div/g)||[]).length - (lines[i].match(/<\/div>/g)||[]).length;
  if (crDepth === 0 && i > confirmRowIdx) { confirmRowEnd = i; break; }
}
lines.splice(confirmRowIdx, confirmRowEnd - confirmRowIdx + 1);
console.log(`✓ confirm-row removed (was lines ${confirmRowIdx+1}–${confirmRowEnd+1})`);

// ── 3. Remove .confirm-row CSS block ──
const cssIdx = lines.findIndex(l => l.trim() === '.confirm-row {');
if (cssIdx !== -1) {
  let d = 0, cssEnd = -1;
  for (let i = cssIdx; i < lines.length; i++) {
    for (const ch of lines[i]) { if (ch === '{') d++; else if (ch === '}') d--; }
    if (d === 0 && i > cssIdx) { cssEnd = i; break; }
  }
  lines.splice(cssIdx, cssEnd - cssIdx + 1);
  console.log('✓ .confirm-row CSS removed');
}

// ── 4. Remove min-height overrides on bottom-row fields (no longer needed) ──
const mhIdx = lines.findIndex(l => l.includes('Geo Targeting: reserve space'));
if (mhIdx !== -1) {
  // Remove the comment + two CSS blocks that follow
  // Find end of last block
  let blocksFound = 0, d2 = 0, end = mhIdx;
  for (let i = mhIdx; i < lines.length; i++) {
    for (const ch of lines[i]) { if (ch === '{') d2++; else if (ch === '}') d2--; }
    if (d2 === 0 && lines[i].trim() === '}') { blocksFound++; if (blocksFound === 2) { end = i; break; } }
  }
  lines.splice(mhIdx, end - mhIdx + 1);
  console.log('✓ Bottom-field min-height overrides removed');
}

// ── 5. Write & syntax check ──
fs.writeFileSync(file, lines.join('\n'));
const out = fs.readFileSync(file, 'utf8');
const sIdx = out.indexOf('<script>'), eIdx = out.indexOf('</script>', sIdx);
try { new Function(out.slice(sIdx + 8, eIdx)); console.log('✓ Syntax OK'); }
catch(e) { console.error('SYNTAX ERROR:', e.message); process.exit(1); }
console.log('Done →', file);
