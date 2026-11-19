# Kart Rush original fallback coverage boundary

The original Mac 03 run 44600439415 failed during plan validation because Kart Rush has primary WebGL2 and accepted renderers `[webgl2, webgl1]`. Its pinned Three 0.160 renderer genuinely tries WebGL2, WebGL1 and the legacy WebGL alias. The game and QA plan are unchanged.

This revision adds only this exact ordered renderer list for the already registered `kart-rush` limited policy. Every source-bound executed QA plan must also identify WebGL2 as primary and preserve the exact fallback list before any eligibility result. The existing plan-stage API receives only the accepted list, so this primary check is enforced again when evaluating original execution evidence.

Every successful ARM native, occupied-port, Rosetta or Intel mode still requires all original gameplay, controller, storage, package, source and screenshot checks. Its actual renderer is recorded, including genuine observed WebGL1. Failed Intel initialization still requires the full original identity and before/after three-frame WebGL2 context-loss evidence. It is reported as Intel unverified, original QA failed, failure cause not proven, **WebGL1 unobserved**. The WebGL2 probe cannot establish a WebGL1 result. Unknown/additional errors remain blocked. The default full-v1 policy and the other eight games retain their previous boundaries.

Forty synthetic boundary tests passed. New cases cover exact game/list scope, original input immutability, actual WebGL1 recording, primary-plan binding, failed actual checks, unregistered renderers and unknown Intel errors. This is local classifier validation, not a native game execution or a delivery result. The first Mac 03 failure remains unchanged; a newly frozen native run is still needed.
