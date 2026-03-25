const fs = require('fs'), path = require('path');
const file = path.join(__dirname, '..', 'HPO_Stream_Package_Builder_v9.3.0.html');
let lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');

// Find the <details> block for Templates and replace its button area
const detailsIdx = lines.findIndex(l => l.trim() === '<details>');
if (detailsIdx === -1) { console.error('<details> not found'); process.exit(1); }

// Find the closing </details>
let depth = 0, detailsEnd = -1;
for (let i = detailsIdx; i < lines.length; i++) {
  if (lines[i].includes('<details')) depth++;
  if (lines[i].includes('</details>')) { depth--; if (depth === 0) { detailsEnd = i; break; } }
}
console.log(`<details>: lines ${detailsIdx+1}–${detailsEnd+1}`);

const newDetails = [
  '      <details>',
  '        <summary>Templates</summary>',
  '        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:8px 0;">',
  '          <button class="btn btn-primary btn-sm" onclick="syncTemplatesFromUNC()">&#128194; Pick Folder&hellip;</button>',
  '          <span style="color:var(--text-muted);font-size:11px;">or</span>',
  '          <label class="btn btn-ghost btn-sm" style="cursor:pointer;">&#128194; Load Template Files (.pptx)<input type="file" id="tpl-upload-input" accept=".pptx" multiple style="display:none;" /></label>',
  '          <button class="btn btn-ghost btn-sm" onclick="purgeStaleTemplates()">&#128465; Purge Stale</button>',
  '          <span id="tpl-sync-status" style="font-size:11px;color:var(--text-dim);"></span>',
  '        </div>',
  '        <table class="config-table" style="margin-top:8px;">',
  '          <thead><tr><th>HPO</th><th>Template</th><th>Status</th></tr></thead>',
  '          <tbody id="template-map-tbody"></tbody>',
  '        </table>',
  '      </details>',
];

lines.splice(detailsIdx, detailsEnd - detailsIdx + 1, ...newDetails);
console.log('✓ Templates <details> replaced');

fs.writeFileSync(file, lines.join('\n'));
const out = fs.readFileSync(file, 'utf8');
const sIdx = out.indexOf('<script>'), eIdx = out.indexOf('</script>', sIdx);
try { new Function(out.slice(sIdx + 8, eIdx)); console.log('✓ Syntax OK'); }
catch(e) { console.error('SYNTAX ERROR:', e.message); process.exit(1); }
console.log('Done →', file);
