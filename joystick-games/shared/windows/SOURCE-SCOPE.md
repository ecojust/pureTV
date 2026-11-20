# Frozen Windows source inputs

`tools/windows-inputs.py` defines the source inventory used by the builder, package verifier, evidence collector and exporter. A fixed Git commit still binds the entire run. The inventory records the actual production, derivation and QA inputs without recursively copying old reports or installation packages into each new evidence artifact.

The concrete read/call graph is:

```text
Windows workflow
├─ plan → catalog-registry.json
├─ source/installer/asset tests → windows-build.py → windows-inputs.py / asset-policy.py
├─ bridge test → Windows Web/bridge.js
├─ build → game metadata + registry + complete game dist/
│  ├─ CMake → Windows Sources/ + protocol test
│  ├─ dependencies.json → hash-pinned nlohmann JSON / WebView2 SDK
│  └─ package → native EXE + complete Web/ + licenses/notices + generated NSIS script
├─ package check → actual ZIP + NSIS install/uninstall + complete installed inventory
├─ runtime → windows-verify.py → macos-verify.py → qa-plan.py
│  ├─ original puretv-joystick/joystick_sdk.py + game qa-plan.json
│  └─ actual installed EXE → packaged bridge.js + diagnostics.js
└─ evidence/export → same source helper + original reports + package hashes
```

The derivation inventory includes the complete game `src/` and `dist/`, source assets, original `package-lock.json`, `package.json`, root build/configuration scripts, original license/notice/provenance, and the complete nonnative shared template families plus `shared/web`. Native platform siblings and historical `docs/` trees do not participate. Existing game roots `test`, `tests`, `qa`, `assets`, `public` and `vendor` are supported; unknown root directories fail and require an explicit source decision. The inventory is an explicit read graph for these build conventions, not a general-purpose JavaScript dependency parser.

Local `file:` package dependencies and lockfile links recursively add their original manifests, locks and complete source trees; cycles are visited once. Local package archives are included byte for byte. Repository escapes, symlink/NTFS-junction traversal, missing required files and unsupported `workspace:`/`link:` manifest forms fail. Installed `node_modules` and caches outside the packaged distribution are excluded; such directories inside `dist/` are rejected so no packaged asset can bypass the inventory. Installed dependencies never replace the original committed lock as evidence.

Already published files are excluded only by exact root filenames declared in a recognized platform release descriptor. The descriptor itself is frozen. A ZIP or model under source assets remains included; there is no blanket archive-extension exclusion. Prior evidence and packages remain untouched in the repository.

Before compilation, every selected byte must match a regular frozen Git blob. `verify_complete_git_selection` also compares the selection to the frozen Git tree, detecting tracked source files or whole shared families deleted from the working tree. After building, the helper enumerates the full set again, detecting additions, removals and byte changes. Package validation and export recompute that inventory and still compare the full packaged Web tree and installed file set.

The collector writes `source-scope.json`, then copies the native host, executed scripts, workflow, QA plan, original SDK and package/build declarations. Large game assets remain bound by the complete source inventory, frozen Git commit and package inventory. Old reports are referenced by original commit/run/hash and are not nested inside new executed-source copies. If scope validation itself fails, the collector preserves its original error and available directly executed scripts, marks `sourceScopeComplete:false`, and does not qualify packages as verified.

The third native attempt, 44583675823, failed during Windows Git checkout before any build/runtime test. Its original API observations are archived separately. Enabling `core.longpaths` before checkout addresses that concrete failure; narrowing source/evidence scope is a separate change and does not rewrite the failed attempt's provenance. The plan job checks out only the registry; the native verification job retains a full checkout so local source dependencies cannot disappear through an underspecified sparse checkout.
