/**
 * test_diagnosis.js
 * Diagnoses PPTX corruption in generatePptx() logic.
 *
 * Checks:
 *  1. Templates extractable from HTML
 *  2. ZIPs loadable
 *  3. Slide XML parseable
 *  4. Unescaped XML special chars in text nodes after replacement
 *  5. $& / $' / $` patterns in shape XML that would corrupt string.replace()
 *  6. </p:spTree> count after merge (must be exactly 1)
 *  7. Final ZIP reloadable as valid JSZip
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// Load JSZip (must use synchronous require — vendor file uses UMD/CommonJS)
const JSZip = require('C:/Users/AI-Operator/HPO-Package-Builder/vendor/jszip.min.js');

// ── Helpers ──────────────────────────────────────────────────────────────────

function pass(msg) { console.log('  [PASS] ' + msg); }
function fail(msg) { console.log('  [FAIL] ' + msg); }
function warn(msg) { console.log('  [WARN] ' + msg); }
function section(msg) { console.log('\n=== ' + msg + ' ==='); }

// Decode base64 to Buffer (Node.js — replaces browser atob + Uint8Array)
function b64ToBuffer(b64) {
  return Buffer.from(b64, 'base64');
}

// Load a JSZip from a base64 string
async function loadZipFromB64(b64) {
  const buf = b64ToBuffer(b64);
  return JSZip.loadAsync(buf);
}

// Replicate the replacement plan used in generatePptx
// (test values matching: clientName=ESPN, dma=New York, hpo=NFL - 2026-2027)
function buildTestPlan() {
  const clientName = 'ESPN';
  const dma        = 'New York';
  const hpo        = 'NFL - 2026-2027';
  const cpm        = '$25.00';
  const startDate  = 'September 4, 2026';
  const endDate    = 'February 7, 2027';

  return {
    global: [
      { find: '[Client Name]',  replace: clientName },
      { find: 'XXX DMA',        replace: dma         },
      { find: '$XX CPM',        replace: cpm          },
    ],
    single: [
      { find: 'Start Date',     replace: startDate   },
      { find: 'End Date',       replace: endDate      },
    ],
    positional: [],
    ecpm: [],
  };
}

// Escape a string so it is safe to use as a RegExp pattern
function escapeRe(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// replaceNth helper (mirrors browser code — not tested here but included for parity)
function replaceNth(str, find, replacement, n) {
  let count = 0;
  return str.replace(new RegExp(escapeRe(find), 'g'), (match) => {
    count++;
    return count === n ? replacement : match;
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('HPO PPTX Corruption Diagnostic');
  console.log('================================');

  // ── Step 1: Extract templates from HTML ──────────────────────────────────
  section('Step 1: Extract templates from HTML');

  const htmlPath = 'C:/Users/AI-Operator/HPO-Package-Builder/index.html';
  const html = fs.readFileSync(htmlPath, 'utf8');

  const masterMatch = html.match(/let EMBEDDED_MASTER_TEMPLATE = '([A-Za-z0-9+/]+=*)/);
  if (masterMatch) {
    pass('EMBEDDED_MASTER_TEMPLATE found (length ' + masterMatch[1].length + ')');
  } else {
    fail('EMBEDDED_MASTER_TEMPLATE NOT FOUND — cannot continue');
    process.exit(1);
  }
  const masterB64 = masterMatch[1];

  const nflMatch = html.match(/'NFL - 2026-2027'\s*:\s*'([A-Za-z0-9+/]+=*)/);
  if (nflMatch) {
    pass('NFL - 2026-2027 template found (length ' + nflMatch[1].length + ')');
  } else {
    fail('NFL - 2026-2027 template NOT FOUND — will test master-only path');
  }
  const nflB64 = nflMatch ? nflMatch[1] : null;

  // ── Step 2: Load both ZIPs ────────────────────────────────────────────────
  section('Step 2: Load ZIPs');

  let masterZip, nflZip;
  try {
    masterZip = await loadZipFromB64(masterB64);
    const masterFiles = Object.keys(masterZip.files);
    pass('Master ZIP loaded OK (' + masterFiles.length + ' entries)');
  } catch (e) {
    fail('Master ZIP failed to load: ' + e.message);
    process.exit(1);
  }

  if (nflB64) {
    try {
      nflZip = await loadZipFromB64(nflB64);
      const nflFiles = Object.keys(nflZip.files);
      pass('NFL ZIP loaded OK (' + nflFiles.length + ' entries)');
    } catch (e) {
      fail('NFL ZIP failed to load: ' + e.message);
      nflZip = null;
    }
  }

  // ── Step 3: Find slide files ──────────────────────────────────────────────
  section('Step 3: Identify slide files');

  const slideFiles = Object.keys(masterZip.files)
    .filter(f => /ppt\/slides\/slide\d+\.xml$/.test(f))
    .sort();

  if (slideFiles.length > 0) {
    pass('Found ' + slideFiles.length + ' slide(s) in master: ' + slideFiles.join(', '));
  } else {
    fail('No slide files found in master ZIP');
    process.exit(1);
  }

  // ── Step 4: Apply replacements and check output XML ───────────────────────
  section('Step 4: Apply replacements + check XML');

  const plan = buildTestPlan();
  const masterFilled = {};

  for (const sf of slideFiles) {
    let xml = await masterZip.file(sf).async('string');
    const originalXml = xml;

    // Apply global replacements
    for (const r of plan.global) {
      const re = new RegExp(escapeRe(r.find), 'g');
      xml = xml.replace(re, r.replace);
    }
    // Apply single replacements
    for (const r of plan.single) {
      const re = new RegExp(escapeRe(r.find));
      xml = xml.replace(re, r.replace);
    }

    masterFilled[sf] = xml;

    // Check 4a: Unescaped & in text content
    // Regex: find &something; is fine (entity ref), bare & is not
    const bareAmpersands = xml.match(/&(?![a-zA-Z#][a-zA-Z0-9#]*;)/g);
    if (bareAmpersands) {
      fail(sf + ': Contains ' + bareAmpersands.length + ' unescaped & character(s) in XML — would corrupt PPTX');
      console.log('    Examples: ' + bareAmpersands.slice(0, 3).join(' | '));
    } else {
      pass(sf + ': No unescaped & found');
    }

    // Check 4b: Unescaped < or > outside of tags (rough heuristic)
    // This is hard to be exact without a full XML parser; we check r.replace values
    for (const r of [...plan.global, ...plan.single]) {
      if (/[<>]/.test(r.replace)) {
        fail('Replacement value for "' + r.find + '" contains < or >: "' + r.replace + '" — would break XML');
      }
    }

    // Check 4c: Count </p:spTree> in each filled slide (should be exactly 1)
    const spTreeCount = (xml.match(/<\/p:spTree>/g) || []).length;
    if (spTreeCount === 1) {
      pass(sf + ': </p:spTree> count = 1 (OK)');
    } else if (spTreeCount === 0) {
      warn(sf + ': No </p:spTree> found — unusual structure');
    } else {
      fail(sf + ': </p:spTree> count = ' + spTreeCount + ' (should be 1) — XML is already corrupt before merge');
    }
  }

  // ── Step 5: Check shape extraction from master ────────────────────────────
  section('Step 5: Shape extraction from master slides');

  const allMasterShapes = {};
  for (const sf of slideFiles) {
    const xml = masterFilled[sf];
    const shapes = [...xml.matchAll(/<p:sp>[\s\S]*?<\/p:sp>/g)].map(m => m[0]);
    allMasterShapes[sf] = shapes;
    pass(sf + ': Extracted ' + shapes.length + ' <p:sp> shape(s)');

    // Check 5a: $& / $' / $` in shape XML (the critical bug)
    // When shapes are used as the replacement string in string.replace(string, string),
    // these sequences have special meaning:
    //   $&  → inserts the matched substring (i.e., '</p:spTree>')
    //   $'  → inserts the portion after the match
    //   $`  → inserts the portion before the match
    //   $1, $2, ... → inserts capture groups (none here, but still risky)
    const shapesJoined = shapes.join('');

    // Check for $& specifically — this is the most dangerous one here
    const dollarAmpCount = (shapesJoined.match(/\$&/g) || []).length;
    if (dollarAmpCount > 0) {
      fail(sf + ': CRITICAL — found ' + dollarAmpCount + ' "$&" pattern(s) in shapes!');
      console.log('    When used as replacement in hpoXml.replace("</p:spTree>", shapes + "</p:spTree>")');
      console.log('    each $& will be replaced with "</p:spTree>" → produces extra </p:spTree> → CORRUPT XML');

      // Show context around each $&
      let searchFrom = 0;
      let found = 0;
      while (found < 3) {
        const idx = shapesJoined.indexOf('$&', searchFrom);
        if (idx === -1) break;
        const ctx = shapesJoined.substring(Math.max(0, idx - 40), idx + 42);
        console.log('    Context: ...' + JSON.stringify(ctx) + '...');
        searchFrom = idx + 1;
        found++;
      }
    } else {
      pass(sf + ': No "$&" patterns in extracted shapes (safe for string.replace)');
    }

    // Check for $' and $` as well
    const dollarTick = (shapesJoined.match(/\$'/g) || []).length;
    const dollarBack = (shapesJoined.match(/\$`/g) || []).length;
    if (dollarTick > 0) fail(sf + ': Found ' + dollarTick + ' "$\'" pattern(s) in shapes — dangerous in string.replace replacement');
    if (dollarBack > 0) fail(sf + ': Found ' + dollarBack + ' "$`" pattern(s) in shapes — dangerous in string.replace replacement');
    if (dollarTick === 0 && dollarBack === 0) pass(sf + ': No "$\'" or "$`" patterns (safe)');

    // Check for $1-$9 patterns (less common but still dangerous if any capture groups exist)
    const dollarNum = (shapesJoined.match(/\$[1-9]/g) || []).length;
    if (dollarNum > 0) warn(sf + ': Found ' + dollarNum + ' "$N" pattern(s) in shapes — may cause issues if replace() has capture groups');
  }

  // ── Step 6: Simulate merge and check result ───────────────────────────────
  section('Step 6: Simulate HPO merge and check merged XML');

  if (nflZip) {
    for (const sf of slideFiles) {
      const masterXml = masterFilled[sf];
      let hpoXml;
      try {
        const hpoFile = nflZip.file(sf);
        if (!hpoFile) {
          warn(sf + ': Not found in NFL ZIP — skipping merge for this slide');
          continue;
        }
        hpoXml = await hpoFile.async('string');
      } catch (e) {
        fail(sf + ': Error reading from NFL ZIP: ' + e.message);
        continue;
      }

      // Replicate the renumbering logic
      const masterShapes = [...masterXml.matchAll(/<p:sp>[\s\S]*?<\/p:sp>/g)].map(m => m[0]);
      const existingIds  = [...hpoXml.matchAll(/\bid="(\d+)"/g)].map(m => parseInt(m[1]));
      let nextId = (existingIds.length ? Math.max(...existingIds) : 0) + 1;
      const renumbered = masterShapes.map(sp =>
        sp.replace(/(<p:cNvPr\b[^>]*)id="(\d+)"/g, (_m, pre, _id) => `${pre}id="${nextId++}"`)
      );

      const shapesString = renumbered.join('');

      // This is the EXACT line from generatePptx:
      const merged = hpoXml.replace('</p:spTree>', shapesString + '</p:spTree>');

      // Check: how many </p:spTree> are in the result?
      const mergedSpTreeCount = (merged.match(/<\/p:spTree>/g) || []).length;
      const hpoSpTreeCount    = (hpoXml.match(/<\/p:spTree>/g) || []).length;

      console.log('  ' + sf + ':');
      console.log('    HPO slide </p:spTree> before merge: ' + hpoSpTreeCount);
      console.log('    Master shapes injected: ' + masterShapes.length);
      console.log('    Merged </p:spTree> count: ' + mergedSpTreeCount);

      if (mergedSpTreeCount === 1) {
        pass(sf + ': Merged XML has exactly 1 </p:spTree> — structure OK');
      } else {
        fail(sf + ': Merged XML has ' + mergedSpTreeCount + ' </p:spTree> — CORRUPT XML!');
        console.log('    This is caused by $& or $\' sequences in the shapes string.');

        // Show the first occurrence of extra </p:spTree>
        let searchPos = 0;
        let occurrenceNum = 0;
        while (occurrenceNum < mergedSpTreeCount && occurrenceNum < 4) {
          const idx = merged.indexOf('</p:spTree>', searchPos);
          if (idx === -1) break;
          const ctxStart = Math.max(0, idx - 60);
          const ctxEnd   = Math.min(merged.length, idx + 40);
          console.log('    Occurrence #' + (occurrenceNum + 1) + ' at char ' + idx + ':');
          console.log('      ...' + JSON.stringify(merged.substring(ctxStart, ctxEnd)) + '...');
          searchPos = idx + 1;
          occurrenceNum++;
        }
      }

      // Check for bare & in merged output
      const mergedBareAmp = (merged.match(/&(?![a-zA-Z#][a-zA-Z0-9#]*;)/g) || []).length;
      if (mergedBareAmp > 0) {
        fail(sf + ': Merged XML contains ' + mergedBareAmp + ' unescaped & — XML invalid');
      } else {
        pass(sf + ': No unescaped & in merged XML');
      }
    }
  } else {
    warn('No NFL ZIP available — skipping HPO merge simulation');
    warn('Testing master-only path instead...');

    // Just confirm the master filled slides are sane
    for (const sf of slideFiles) {
      const xml = masterFilled[sf];
      const spTreeCount = (xml.match(/<\/p:spTree>/g) || []).length;
      console.log('  ' + sf + ': </p:spTree> count = ' + spTreeCount + (spTreeCount === 1 ? ' (OK)' : ' (PROBLEM)'));
    }
  }

  // ── Step 7: Build output ZIP and reload it ────────────────────────────────
  section('Step 7: Build output ZIP and reload validation');

  const outZip = new JSZip();

  if (nflZip) {
    // Copy NFL ZIP as base
    for (const [p, file] of Object.entries(nflZip.files)) {
      if (!file.dir) outZip.file(p, await file.async('arraybuffer'));
    }
    // Write merged slides
    for (const sf of slideFiles) {
      const masterXml = masterFilled[sf];
      const hpoFile   = nflZip.file(sf);
      if (!hpoFile) continue;
      const hpoXml    = await hpoFile.async('string');

      const masterShapes = [...masterXml.matchAll(/<p:sp>[\s\S]*?<\/p:sp>/g)].map(m => m[0]);
      const existingIds  = [...hpoXml.matchAll(/\bid="(\d+)"/g)].map(m => parseInt(m[1]));
      let nextId = (existingIds.length ? Math.max(...existingIds) : 0) + 1;
      const renumbered = masterShapes.map(sp =>
        sp.replace(/(<p:cNvPr\b[^>]*)id="(\d+)"/g, (_m, pre, _id) => `${pre}id="${nextId++}"`)
      );
      const merged = hpoXml.replace('</p:spTree>', renumbered.join('') + '</p:spTree>');
      outZip.file(sf, merged);
    }
  } else {
    // Master-only path
    for (const [p, file] of Object.entries(masterZip.files)) {
      if (!file.dir) outZip.file(p, await file.async('arraybuffer'));
    }
    for (const sf of slideFiles) {
      outZip.file(sf, masterFilled[sf]);
    }
  }

  let outputBuffer;
  try {
    outputBuffer = await outZip.generateAsync({
      type: 'nodebuffer',
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });
    pass('Output ZIP generated OK (' + outputBuffer.length + ' bytes)');
  } catch (e) {
    fail('Output ZIP generation FAILED: ' + e.message);
    process.exit(1);
  }

  // Save it for manual inspection
  const outPath = 'C:/Users/AI-Operator/HPO-Package-Builder/test_output.pptx';
  fs.writeFileSync(outPath, outputBuffer);
  pass('Saved test output to: ' + outPath);

  // Reload the output ZIP to verify it is a valid ZIP
  try {
    const reloaded = await JSZip.loadAsync(outputBuffer);
    const reloadedFiles = Object.keys(reloaded.files);
    pass('Output ZIP reloads as valid JSZip (' + reloadedFiles.length + ' entries)');

    // Check that slide XMLs are present
    const reloadedSlides = reloadedFiles.filter(f => /ppt\/slides\/slide\d+\.xml$/.test(f));
    pass('Reloaded ZIP contains ' + reloadedSlides.length + ' slide file(s)');

    // Spot-check: read first slide from reloaded ZIP and count </p:spTree>
    if (reloadedSlides.length > 0) {
      const firstSlide = reloadedSlides[0];
      const reloadedXml = await reloaded.file(firstSlide).async('string');
      const finalSpTreeCount = (reloadedXml.match(/<\/p:spTree>/g) || []).length;
      if (finalSpTreeCount === 1) {
        pass('Reloaded ' + firstSlide + ': </p:spTree> count = 1 (OK)');
      } else {
        fail('Reloaded ' + firstSlide + ': </p:spTree> count = ' + finalSpTreeCount + ' — CONFIRM CORRUPT');
      }
    }
  } catch (e) {
    fail('Output ZIP FAILED to reload: ' + e.message);
  }

  // ── Step 8: Summary of the $& bug specifically ────────────────────────────
  section('Step 8: $& bug deep-dive summary');

  console.log('');
  console.log('  The bug vector:');
  console.log('    hpoXml.replace("</p:spTree>", shapesString + "</p:spTree>")');
  console.log('  where .replace(string, string) interprets special replacement patterns:');
  console.log('    $&  → inserts the match ("</p:spTree>") wherever it appears in shapes');
  console.log('    $\'  → inserts text after the match');
  console.log('    $`  → inserts text before the match');
  console.log('');

  // Scan ALL master slides for $& in their raw XML (before fill — could be in shape data)
  let totalDollarAmp = 0;
  for (const sf of slideFiles) {
    const rawXml  = await masterZip.file(sf).async('string');
    const count   = (rawXml.match(/\$&/g) || []).length;
    totalDollarAmp += count;
    if (count > 0) {
      fail(sf + ': RAW master XML contains ' + count + ' "$&" — these will survive fill and corrupt merge');
    }
  }
  if (totalDollarAmp === 0) {
    pass('No $& found in raw master slide XML');
  }

  // Also check the filled slides
  let totalFilledDollarAmp = 0;
  for (const sf of slideFiles) {
    const filledXml = masterFilled[sf];
    const count = (filledXml.match(/\$&/g) || []).length;
    totalFilledDollarAmp += count;
    if (count > 0) {
      fail(sf + ': FILLED master XML contains ' + count + ' "$&" — INTRODUCED BY REPLACEMENT VALUES');
      console.log('    Check that clientName/DMA/CPM values do not contain $&');
    }
  }
  if (totalFilledDollarAmp === 0) {
    pass('No $& found in filled master slide XML');
  } else {
    fail('TOTAL $& in filled slides: ' + totalFilledDollarAmp);
  }

  console.log('\n=== DIAGNOSIS COMPLETE ===\n');
}

main().catch(e => {
  console.error('\n[FATAL ERROR]', e);
  process.exit(1);
});
