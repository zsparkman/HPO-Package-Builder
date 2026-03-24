const fs = require('fs'), path = require('path');
const file = path.join(__dirname, 'HPO_Stream_Package_Builder_v9.3.0.html');
let lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');

// ── 1. Replace sub-toggle buttons with a <select> ──
const subStart = lines.findIndex(l => l.includes('<div class="special-sub-toggles hidden"'));
if (subStart === -1) { console.error('special-sub-toggles not found'); process.exit(1); }
let depth = 0, subEnd = -1;
for (let i = subStart; i < lines.length; i++) {
  depth += (lines[i].match(/<div/g)||[]).length - (lines[i].match(/<\/div>/g)||[]).length;
  if (depth === 0 && i > subStart) { subEnd = i; break; }
}
console.log(`special-sub-toggles HTML: lines ${subStart+1}–${subEnd+1}`);

const newSubHTML = [
  '        <div class="special-sub-toggles hidden" id="special-sub-toggles">',
  '          <select id="special-rate-select">',
  '            <option value="">Select Special Rate...</option>',
  '            <option value="Hold Co. + Horizon">Hold Co. + Horizon</option>',
  '            <option value="Canvas">Canvas</option>',
  '          </select>',
  '        </div>',
];
lines.splice(subStart, subEnd - subStart + 1, ...newSubHTML);
console.log('✓ HTML updated');

// ── 2. Replace setupRateClassToggles ──
const fnIdx = lines.findIndex(l => l.trim() === 'function setupRateClassToggles() {');
if (fnIdx === -1) { console.error('setupRateClassToggles not found'); process.exit(1); }
let fnDepth = 0, fnEnd = -1;
for (let i = fnIdx; i < lines.length; i++) {
  for (const ch of lines[i]) { if (ch === '{') fnDepth++; else if (ch === '}') fnDepth--; }
  if (fnDepth === 0 && i > fnIdx) { fnEnd = i; break; }
}
console.log(`setupRateClassToggles: lines ${fnIdx+1}–${fnEnd+1}`);

const newFn = [
  'function setupRateClassToggles() {',
  "  const toggles    = document.querySelectorAll('#rate-class-toggles .rate-toggle');",
  "  const subPanel   = document.getElementById('special-sub-toggles');",
  "  const subSelect  = document.getElementById('special-rate-select');",
  "  const hiddenInput = document.getElementById('rate-class-value');",
  '',
  '  toggles.forEach(toggle => {',
  "    toggle.addEventListener('click', () => {",
  "      toggles.forEach(t => t.classList.remove('active'));",
  "      toggle.classList.add('active');",
  '      const rate = toggle.dataset.rate;',
  "      if (rate === 'Special') {",
  "        subPanel.classList.remove('hidden');",
  '        // Use current selection or prompt',
  "        hiddenInput.value = subSelect.value || '';",
  '      } else {',
  "        subPanel.classList.add('hidden');",
  "        subSelect.value = '';",
  '        hiddenInput.value = rate;',
  '      }',
  '      checkConfirmReady();',
  '    });',
  '  });',
  '',
  "  subSelect.addEventListener('change', () => {",
  "    subSelect.classList.toggle('has-value', !!subSelect.value);",
  '    hiddenInput.value = subSelect.value;',
  '    checkConfirmReady();',
  '  });',
  '}',
];
lines.splice(fnIdx, fnEnd - fnIdx + 1, ...newFn);
console.log('✓ setupRateClassToggles updated');

// ── 3. Write & syntax check ──
fs.writeFileSync(file, lines.join('\n'));
const out = fs.readFileSync(file, 'utf8');
const sIdx = out.indexOf('<script>'), eIdx = out.indexOf('</script>', sIdx);
try { new Function(out.slice(sIdx + 8, eIdx)); console.log('✓ Syntax OK'); }
catch(e) { console.error('SYNTAX ERROR:', e.message); process.exit(1); }
console.log('Done →', file);
