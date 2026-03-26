const fs = require('fs'), path = require('path');
const file = path.join(__dirname, '..', 'HPO_Stream_Package_Builder_v9.3.0.html');
let lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');

// ── 1. const → let for EMBEDDED_MASTER_TEMPLATE ──
const constLine = lines.findIndex(l => l.startsWith('const EMBEDDED_MASTER_TEMPLATE'));
if (constLine === -1) { console.error('EMBEDDED_MASTER_TEMPLATE not found'); process.exit(1); }
lines[constLine] = lines[constLine].replace('const EMBEDDED_MASTER_TEMPLATE', 'let EMBEDDED_MASTER_TEMPLATE');
console.log(`✓ EMBEDDED_MASTER_TEMPLATE changed to let (line ${constLine+1})`);

// ── 2. HTML: add Master Template row inside Templates <details>, before the config-table ──
const tplTableLine = lines.findIndex(l => l.includes('<table class="config-table"') && l.includes('margin-top:8px'));
if (tplTableLine === -1) { console.error('template config-table not found'); process.exit(1); }
lines.splice(tplTableLine, 0,
  '        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:10px;padding:8px 10px;background:var(--bg-input);border-radius:var(--radius-sm);border:1.5px solid rgba(46,236,192,0.15);">',
  '          <span style="font-size:12px;font-weight:600;color:var(--text);">Master Template</span>',
  '          <span id="master-tpl-badge" style="font-size:11px;color:var(--text-muted);"></span>',
  '          <label class="btn btn-ghost btn-sm" style="cursor:pointer;margin-left:auto;">&#128194; Replace (.pptx)<input type="file" id="master-tpl-input" accept=".pptx" style="display:none;" /></label>',
  '          <span id="master-tpl-status" style="font-size:11px;color:var(--text-dim);"></span>',
  '        </div>',
);
console.log(`✓ Master Template HTML row inserted before line ${tplTableLine+1}`);

// ── 3. JS: add event listener in setupAdmin(), after tpl-upload-input listener ──
const tplListenerEnd = lines.findIndex(l => l.includes("document.getElementById('tpl-upload-input').addEventListener"));
// find the closing }) of that listener
let depth = 0, tplListenerClose = tplListenerEnd;
for (let i = tplListenerEnd; i < lines.length; i++) {
  for (const ch of lines[i]) { if (ch === '{') depth++; else if (ch === '}') depth--; }
  if (depth === 0 && i > tplListenerEnd) { tplListenerClose = i; break; }
}
lines.splice(tplListenerClose + 1, 0,
  '',
  "  // Master template upload",
  "  const masterBadge = document.getElementById('master-tpl-badge');",
  "  if (masterBadge) masterBadge.textContent = EMBEDDED_MASTER_TEMPLATE ? 'Embedded' : 'Not loaded';",
  "  document.getElementById('master-tpl-input').addEventListener('change', async e => {",
  "    const file = e.target.files[0];",
  "    const statusEl = document.getElementById('master-tpl-status');",
  "    if (!file || !file.name.endsWith('.pptx')) return;",
  "    try {",
  "      const ab = await file.arrayBuffer();",
  "      EMBEDDED_MASTER_TEMPLATE = arrayBufferToBase64(ab);",
  "      document.getElementById('master-tpl-badge').textContent = file.name;",
  "      statusEl.textContent = '\\u2713 Loaded'; statusEl.style.color = 'var(--green)';",
  "    } catch(err) {",
  "      statusEl.textContent = 'Error: ' + err.message; statusEl.style.color = 'var(--red)';",
  "    }",
  "    e.target.value = '';",
  "  });",
);
console.log(`✓ Master template JS listener inserted after line ${tplListenerClose+1}`);

// ── 4. Write & syntax check ──
fs.writeFileSync(file, lines.join('\n'));
const out = fs.readFileSync(file, 'utf8');
const sIdx = out.indexOf('<script>'), eIdx = out.indexOf('</script>', sIdx);
try { new Function(out.slice(sIdx + 8, eIdx)); console.log('✓ Syntax OK'); }
catch(e) { console.error('SYNTAX ERROR:', e.message); process.exit(1); }
console.log('Done →', file);
