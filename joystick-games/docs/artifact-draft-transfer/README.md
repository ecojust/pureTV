# Original artifact ZIP → existing draft Release

This is a byte-preservation route for original catalog package artifacts whose ZIP is too large for a Git evidence export or whose signed download redirect cannot be reached locally. It does not rebuild, unpack, recompress, sign, install, publish, or approve a package. Existing platform exporters and their 100 MB limit are unchanged.

The implementation is `joystick-games/tools/artifact-draft-transfer.py`, with an independent manually dispatched workflow `.github/workflows/joystick-artifact-draft-transfer.yml`. No transfer or Release mutation has been executed while developing this tool.

## Required existing destination and inputs

An operator must first review and provide an **already existing draft** in `ecojust/pureTV`. This tool has no create/edit/publish/delete Release operation. The draft must have:

- `draft: true`;
- exact tag `racing-package-staging-{source_run}-attempt-{source_attempt}`;
- `target_commitish` equal to the full original source SHA, not a branch name;
- no asset named `artifact-{artifact_id}.zip`.

Dispatch inputs are `source_run`, `source_attempt`, `source_sha`, `artifact_id`, and `release_id`. Example original identity currently available for independent operator review: run `44599353036`, attempt `1`, source `d548bccbe816bd4c03620388556ceef507b67d30`, artifact `14567692465`, name `joystick-android-signed`, ZIP size **104,995,469 bytes**, SHA-256 `7266f2a123eda2c8196abf6f9156fcacc453f3d70258dba75ca3b3afa6a7bd95`. This is the **outer Actions ZIP size**, not the APK size. An existing release ID must be supplied separately.

The operator chooses a reviewed, committed version of this workflow. The workflow checks out that version, runs offline boundary tests, executes the transfer, and preserves its receipt even on failure. It is not triggered by push or pull request.

## Exact identity and byte checks

Only the original `joystick-catalog-android.yml`, `joystick-catalog-macos.yml`, and `joystick-catalog-windows.yml` workflows are allowed, with `workflow_dispatch`, matching repository/head repository, run ID, exact attempt, and source SHA. A run may still be testing; its producing job must be completed. Only these original package artifact names are accepted:

| Workflow | Artifact | Producing job / upload occurrence |
| --- | --- | --- |
| Android | `joystick-android-signed` | `sign`, first upload |
| Android | `joystick-android-unsigned-{game}` | `build ({game})`, first upload |
| macOS | `joystick-catalog-macos-packages-{batch}` | `build ({batch})`, second upload |
| Windows | `joystick-windows-packages-{game}` | `verify ({game})`, second upload |

Each whitelisted producer currently has exactly two `actions/upload-artifact@v4` steps. The tool fails closed if this layout changes. Artifact metadata has no attempt field, so attempt binding uses the exact attempt's job ID/source and the artifact's creation time within the designated successful upload step. This also avoids an adjacent report upload being mistaken for the package upload when API timestamps share a second. The job's overall conclusion is recorded, not promoted to package/QA acceptance. Partial package archives from an overall failed build remain unapproved original bytes.

The artifact ID must also appear in that exact run's artifact listing with matching metadata. Expired artifacts, absent SHA-256 digests, malformed identities, pagination beyond 500 entries, and ZIP sizes above 1,000,000,000 bytes are rejected. Direct artifact size and SHA-256 are checked against the downloaded stream. The archive is never extracted or repacked. Signed blob redirects are HTTPS-only and restricted to Actions/Azure artifact hosts; the GitHub token is never forwarded to those hosts.

Immediately before upload, artifact metadata and the existing draft identity are rechecked, including asset-name collision. There is exactly one POST to the fixed `uploads.github.com/repos/ecojust/pureTV/releases/{id}/assets` endpoint. No automatic upload retry, replacement, or deletion is performed. After upload, the asset's API size/digest/name/state and release membership are checked, and the release must still be a draft. Checks cannot atomically prevent another operator from changing the Release concurrently; coordinate its ownership during transfer. If the request times out or verification fails, inspect the recorded phase and existing assets before any explicit new attempt.

## Output and recovery

The untouched ZIP is uploaded as `artifact-{artifact_id}.zip`. It is stored only in the existing draft Release and transient runner download directory. `transfer.json` records source/job/artifact identity, ZIP hash/bytes, destination identity, returned asset ID, verification outcome, executed script hash, and safe failure code. It contains no tokens or signed URLs. Socket operations are bounded to 30 seconds, streaming download/upload each to 900 seconds, and the workflow to 35 minutes.

The receipt is separately uploaded as a small Actions artifact and exported alone to a new create-only branch:

`build-assets/artifact-draft-transfer-{transfer_run_id}-attempt-{transfer_attempt}`

The Git export accepts only `transfer.json`, under 128 KB; ZIPs cannot enter that branch. An existing branch or asset is never overwritten. Original failed build/runtime reports are not modified by this workflow. A failed transfer remains failed, even when its receipt export succeeds.

After retrieving the draft asset, the operator independently verifies the receipt and ZIP hash, inspects the original package manifests, verifies the existing signing identity and source bindings, and completes the required native QA before deciding any delivery or publication. A successful byte-transfer receipt grants none of those conclusions.

## Local checks

```sh
python3 joystick-games/tools/artifact-draft-transfer-test.py
```

The tests use fake APIs, fake HTTPS connections and temporary files. They do not require a token or contact GitHub. Coverage includes wrong run/source/attempt/repository, name and expiry rules, exact producer/upload binding, size/digest failures, non-draft and mismatched destinations, duplicate assets, stripped redirect credentials, forbidden redirect hosts, stream bounds, one fixed upload operation, upload failure redaction/no retry, final API digest mismatch, and receipt-only create-only Git export. Real Android/macOS/Windows package or physical-device acceptance is outside these tests.

## First actual transfer, operator-triggered

Run [44602586551](https://github.com/ecojust/pureTV/actions/runs/44602586551), frozen transfer-tool source `8554f453898632594c7cd98e3c58ab0209318950`, completed successfully. Original artifact `14567692465` was copied to the existing draft Release `451851848` as asset `769042251`. Its API size is 104,995,469 bytes and digest is `sha256:7266f2a123eda2c8196abf6f9156fcacc453f3d70258dba75ca3b3afa6a7bd95`, matching the original Actions ZIP. A separate read-only review confirmed the release remained a draft with the exact source/tag. The receipt-only export commit is `11f82589d20d32b01947787f34a23ef7183dac02`. Untouched receipt/API metadata and their hashes are retained in [run-44602586551/review.json](run-44602586551/review.json). This reviewer did not download the ZIP or verify its inner APK/signature/gameplay; those are separate operator steps.
