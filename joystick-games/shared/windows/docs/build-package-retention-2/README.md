# Correct actual saved-storage report schema

The first retention exporter (`4d71ccf`) incorrectly required `nativeSavedAfterQuit is True`. The actual Windows verifier stores the persisted string map in this field. This would reject a legitimately passed game; the original synthetic fixture and first static review did not catch it.

The correction accepts only a nonempty dictionary of string keys and values, alongside the unchanged passed storage status, hydration and clean-cache checks. Boolean placeholders, empty objects and invalid value types are rejected. Failed/missing QA still remains unverified; package/source binding, size limits and publication state are unchanged.

[original-shape-replay.json](original-shape-replay.json) preserves the concrete old rejection for four games using both original reports from run `44615299245`, then the corrected pure-function result. The fixture records the original report paths and hashes and explicitly identifies extracted fields. Original reports, packages and the earlier review remain untouched. All 32 exporter tests passed; no native run or workflow dispatch was performed for this correction.

Windows run `44621752383` had already started with source `039d210` before discovery. It was not cancelled or repeated. If its export encounters this schema error, recovery must use the same original packages and reports with a separately frozen corrected reader.
