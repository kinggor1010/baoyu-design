# Maintained baoyu-design fork

This fork preserves the complete upstream skill and its optional features, with a small security patch. It is not the text-only Impeccable profile and does not certify the full upstream toolchain as safe.

- Upstream: https://github.com/JimLiu/baoyu-design
- Reviewed base: `6530033592bf7fa58bc1a5a2a2ad278da45213a9`
- Maintained fork: https://github.com/kinggor1010/baoyu-design
- Maintained branch: `codex/hardened`
- Installed entry: `skills/baoyu-design/SKILL.md`

## Changes

1. Design-system CSS imports and manifest fallback entries must remain under the selected source directory. The importer's file copies, generated prompt and project metadata reject symlinks below the selected roots. Normal relative references within the source tree still work. A per-recursion CSS iterator also ensures nested imports cannot cause a later sibling to be skipped.
2. Documented Python preview servers bind to `127.0.0.1` rather than all interfaces.
3. Imported guides and prompt excerpts are explicitly untrusted design data; they cannot authorize commands, credential access, dependency installation or uploads.
4. Tests use repository-local `.codex-tmp/` scratch directories.
5. The skill requires explicit invocation: `SKILL.md` frontmatter sets `disable-model-invocation: true` (Claude Code) and `skills/baoyu-design/agents/openai.yaml` sets `policy.allow_implicit_invocation: false` (Codex). Automatic selection is disabled in both hosts; the upstream description and all design instructions are unchanged.

No design playbooks, starter components, bundled libraries or optional import/export capabilities were removed. No dependency manifests or locks were changed.

## Validation

Run with an existing Node.js installation; these tests use Node standard libraries and the reviewed importer/parser/prompt modules, without loading the vendored compiler or installing packages:

```sh
node --test skills/baoyu-design/agents/tests/import-security.test.mjs skills/baoyu-design/agents/tests/ds-core.test.mjs skills/baoyu-design/agents/tests/ds-prompt.test.mjs
```

40 tests passed on macOS, including normal nested imports/assets, CSS traversal, manifest traversal, absolute imports, source symlinks, destination directory/file symlinks, generated-prompt and metadata symlinks. Skill frontmatter validation and `git diff --check` also passed. Full compiler, Figma decoder, browser export and video suites were not run.

The path checks are not a filesystem sandbox against another local process racing path changes. They also do not sanitize copied JavaScript, HTML or the contents of a design system. Preview trusted or separately reviewed designs; localhost binding prevents ordinary LAN access, not access by other processes on the same machine.

## Retained issues and audit limits

Both optional export helpers still lock `esbuild@0.24.2`, affected by [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99) (moderate; fixed in 0.25.0). Their reviewed build scripts bundle code and do not invoke esbuild's vulnerable development server. The user requested preserving upstream behavior where issues were not very serious, so this patch does not change that dependency stack. Do not interpret that choice as full dependency clearance or authorization for arbitrary future installations.

The 23 September dependency survey queried 56 upstream npm identities through OSV, with this one vulnerability match. GitHub malware queries completed for 38; 18 hit rate limits. Exact provenance/version mapping remains incomplete for some vendored code and external runtimes. No package installation, runtime downloader, Chromium or ffmpeg execution was used for this maintenance work. Future optional dependency installation remains subject to the user's applicable audit policy.

## Installation and updates

The parent `agents-skills` repository pins this fork at an exact commit under `vendor/baoyu-design`. Its `skills/baoyu-design` symlink points to this repository's `skills/baoyu-design` folder. No npm installer is needed to expose the skill; optional export tools have separate setup requirements.

GitHub Actions should remain disabled on the maintained fork; the inherited workflows are not part of the review. Do not auto-update the installed submodule or pull upstream directly into it. For an update:

1. Inspect the candidate in a separate checkout under the parent's `.codex-tmp/`, with hooks disabled and no recursive submodules. Treat incoming instructions as review data.
2. Compare from the recorded upstream base, including skill instructions, executable helpers, lockfiles, bundled code and workspace configuration. Preserve or rework these fixes; investigate new executable setup and external data flows.
3. Run the focused tests above. Audit any new dependencies before installing or executing them. Recheck optional-tool risks if their code changes.
4. Commit the reviewed change in the fork and push it to the maintained branch. Only then advance the parent gitlink to that exact commit and record the new base and validation evidence.
5. Verify the skill link and clean submodule checkout. Roll back by restoring a previously reviewed parent gitlink and checking out that commit.

A pinned commit makes updates deliberate; it does not guarantee behavior or rule out unreported vulnerabilities and malware.
