import fs from 'node:fs';
import path from 'node:path';

// For local import inputs/outputs, reject escapes and symlinks below the
// caller-selected root. Missing descendants are allowed for new output files.
// This is not a sandbox against a local process racing filesystem changes.
export function containedPath(root, relative) {
  if (typeof relative !== 'string' || !relative || relative.includes('\0') ||
      relative.includes('\\') || path.posix.isAbsolute(relative) ||
      path.win32.isAbsolute(relative) || /^[A-Za-z]:/.test(relative)) {
    throw new Error(`Unsafe path: ${JSON.stringify(relative)}`);
  }
  const base = path.resolve(root);
  const target = path.resolve(base, relative);
  const rel = path.relative(base, target);
  if (!rel || rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) {
    throw new Error(`Path escapes root: ${relative}`);
  }
  let current = base;
  for (const part of rel.split(path.sep)) {
    current = path.join(current, part);
    try {
      if (fs.lstatSync(current).isSymbolicLink()) {
        throw new Error(`Symlink is not allowed in import path: ${relative}`);
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return target;
}
