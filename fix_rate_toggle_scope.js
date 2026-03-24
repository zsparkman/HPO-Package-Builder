const fs = require('fs'), path = require('path');
const file = path.join(__dirname, 'HPO_Stream_Package_Builder_v9.3.0.html');
let lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');

// setupRateClassToggles uses querySelectorAll('.rate-toggle') which picks up DMA toggles too.
// Scope it to the rate class container only.
const idx = lines.findIndex(l =>
  l.includes("querySelectorAll('.rate-toggle')") &&
  !l.includes('#dma-mode-toggles')
);
if (idx === -1) { console.error('line not found'); process.exit(1); }
lines[idx] = lines[idx].replace(
  "querySelectorAll('.rate-toggle')",
  "querySelectorAll('#rate-class-value ~ * .rate-toggle, .rate-class-toggles:not(#dma-mode-toggles) .rate-toggle')"
);

// Simpler: just give the rate class toggle group its own id and scope to that
// Actually, simplest fix: scope by data-rate attribute presence
lines[idx] = lines[idx].replace(
  "querySelectorAll('#rate-class-value ~ * .rate-toggle, .rate-class-toggles:not(#dma-mode-toggles) .rate-toggle')",
  "querySelectorAll('.rate-class-toggles:not(#dma-mode-toggles) .rate-toggle')"
);

console.log(`Fixed line ${idx+1}: ${lines[idx].trim()}`);

fs.writeFileSync(file, lines.join('\n'));
const out = fs.readFileSync(file, 'utf8');
const sIdx = out.indexOf('<script>'), eIdx = out.indexOf('</script>', sIdx);
try { new Function(out.slice(sIdx + 8, eIdx)); console.log('✓ Syntax OK'); }
catch(e) { console.error('SYNTAX ERROR:', e.message); }
console.log('Done →', file);
