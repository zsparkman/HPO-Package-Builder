const fs = require('fs'), path = require('path');
const file = path.join(__dirname, '..', 'HPO_Stream_Package_Builder_v9.3.0.html');
let lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');

// Find the Templates button row inside <details>
const oldLine = lines.findIndex(l =>
  l.includes("syncTemplatesFromSP()") && l.includes("Sync Missing from SP")
);
if (oldLine === -1) { console.error('Templates button row not found'); process.exit(1); }
console.log(`Replacing line ${oldLine+1}`);

// Replace the entire button row div (single line)
lines[oldLine] =
  '          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:8px;">' +
  '<button class="btn btn-primary btn-sm" onclick="syncTemplatesFromUNC()">&#128194; Pick Folder&hellip;</button>' +
  '<span style="color:var(--text-muted);font-size:11px;">or</span>' +
  '<label class="btn btn-ghost btn-sm" style="cursor:pointer;">&#128194; Load Template Files (.pptx)<input type="file" id="tpl-upload-input" accept=".pptx" multiple style="display:none;" /></label>' +
  '<button class="btn btn-ghost btn-sm" onclick="purgeStaleTemplates()">&#128465; Purge Stale</button>' +
  '<span id="tpl-sync-status" style="font-size:11px;color:var(--text-dim);"></span>' +
  '</div>';

// Remove the now-orphaned Purge Stale / Upload line that follows
const nextBtnLine = lines.findIndex((l, i) =>
  i > oldLine && l.includes('purgeStaleTemplates') && l.includes('tpl-upload-input')
);
if (nextBtnLine !== -1) {
  lines.splice(nextBtnLine, 1);
  console.log(`✓ Removed old button row at line ${nextBtnLine+1}`);
}

fs.writeFileSync(file, lines.join('\n'));
const out = fs.readFileSync(file, 'utf8');
const sIdx = out.indexOf('<script>'), eIdx = out.indexOf('</script>', sIdx);
try { new Function(out.slice(sIdx + 8, eIdx)); console.log('✓ Syntax OK'); }
catch(e) { console.error('SYNTAX ERROR:', e.message); process.exit(1); }
console.log('Done →', file);
