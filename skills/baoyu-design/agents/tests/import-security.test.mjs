// No compiler/vendor dependencies: exercise the importer with CSS-only fixtures.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { tmpdir, write, read, runScript } from './helpers.mjs';

function fixture(t) {
  const base = tmpdir(t);
  const ds = path.join(base, 'kit');
  const project = path.join(base, 'project');
  write(ds, '_ds_manifest.json', '{}');
  write(ds, 'styles.css', ':root { --color: #123; }');
  fs.mkdirSync(project);
  return { base, ds, project };
}
const run = ({ ds, project }) => runScript('import-design-system.mjs', [ds, project]);
function refused(f, pattern = /escapes root|Unsafe|Symlink/) {
  const result = run(f);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, pattern);
}

test('valid nested CSS imports and assets still copy', (t) => {
  const f = fixture(t);
  write(f.ds, 'styles.css', '@import "css/a.css"; @import "css/b.css";');
  write(f.ds, 'css/a.css', '@import "../tokens.css";');
  write(f.ds, 'tokens.css', ':root { --color: #123; }');
  write(f.ds, 'css/b.css', 'body { background: url(../assets/dot.txt); }');
  write(f.ds, 'assets/dot.txt', 'asset');
  const result = run(f);
  assert.equal(result.status, 0, result.stderr);
  for (const name of ['styles.css', 'css/a.css', 'css/b.css', 'tokens.css', 'assets/dot.txt']) {
    assert.equal(read(f.project, `_ds/kit/${name}`), read(f.ds, name));
  }
});

test('CSS traversal cannot overwrite a project sibling', (t) => {
  const f = fixture(t);
  write(f.base, 'outside.css', 'attacker');
  write(f.project, '_ds/outside.css', 'original');
  write(f.ds, 'styles.css', '@import "../outside.css";');
  refused(f);
  assert.equal(read(f.project, '_ds/outside.css'), 'original');
});

test('traversal in a later sibling after a nested import is rejected', (t) => {
  const f = fixture(t);
  write(f.base, 'outside.css', 'attacker');
  write(f.ds, 'styles.css', '@import "nested.css"; @import "../outside.css";');
  write(f.ds, 'nested.css', '@import "tokens.css";');
  write(f.ds, 'tokens.css', ':root { --color: #123; }');
  refused(f);
});

test('manifest fallback cannot name an external file', (t) => {
  const f = fixture(t);
  fs.unlinkSync(path.join(f.ds, 'styles.css'));
  write(f.base, 'outside.txt', 'private');
  write(f.ds, '_ds_manifest.json', JSON.stringify({ globalCssPaths: ['../outside.txt'] }));
  refused(f);
});

test('absolute CSS paths are rejected', (t) => {
  const f = fixture(t);
  const outside = write(f.base, 'outside.css', 'private');
  write(f.ds, 'styles.css', `@import "${outside}";`);
  refused(f);
});

test('CSS cannot read through a source symlink', (t) => {
  const f = fixture(t);
  const outside = write(f.base, 'outside.css', 'private');
  fs.symlinkSync(outside, path.join(f.ds, 'linked.css'));
  write(f.ds, 'styles.css', '@import "linked.css";');
  refused(f);
});

test('CSS assets cannot copy through a source symlink', (t) => {
  const f = fixture(t);
  const outside = write(f.base, 'outside.txt', 'private');
  fs.symlinkSync(outside, path.join(f.ds, 'secret.txt'));
  write(f.ds, 'styles.css', 'body { background: url(secret.txt); }');
  refused(f);
  assert.equal(fs.existsSync(path.join(f.project, '_ds/kit/secret.txt')), false);
});

test('output directory symlink cannot redirect writes', (t) => {
  const f = fixture(t);
  const outside = path.join(f.base, 'outside');
  fs.mkdirSync(outside);
  fs.symlinkSync(outside, path.join(f.project, '_ds'));
  refused(f);
  assert.deepEqual(fs.readdirSync(outside), []);
});

for (const target of ['styles.css', '_ds_prompt.md']) {
  test(`output ${target} symlink cannot overwrite an external file`, (t) => {
    const f = fixture(t);
    const outside = write(f.base, 'outside.txt', 'original');
    fs.mkdirSync(path.join(f.project, '_ds/kit'), { recursive: true });
    fs.symlinkSync(outside, path.join(f.project, '_ds/kit', target));
    refused(f);
    assert.equal(read(f.base, 'outside.txt'), 'original');
  });
}

test('metadata symlink cannot overwrite an external file', (t) => {
  const f = fixture(t);
  const outside = write(f.base, 'outside.json', '{}');
  fs.symlinkSync(outside, path.join(f.project, '_d_meta.json'));
  refused(f);
  assert.equal(read(f.base, 'outside.json'), '{}');
});
