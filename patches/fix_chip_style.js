const fs = require('fs'), path = require('path');
const file = path.join(__dirname, '..', 'HPO_Stream_Package_Builder_v9.3.0.html');
let lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');

// Insert override rule for chips inside the tag input — borderless pills
const insertAfter = lines.findIndex(l => l.includes('.dma-tag-option.already-selected'));
if (insertAfter === -1) { console.error('anchor not found'); process.exit(1); }

const override = [
  '.dma-tag-input .dma-chip {',
  '  border: none;',
  '  background: rgba(27,200,160,0.18);',
  '  border-radius: 20px;',
  '  padding: 3px 6px 3px 9px;',
  '  font-size: 12px;',
  '}',
];
lines.splice(insertAfter + 1, 0, ...override);
console.log(`✓ Chip override inserted after line ${insertAfter+1}`);

fs.writeFileSync(file, lines.join('\n'));
console.log('Done →', file);
