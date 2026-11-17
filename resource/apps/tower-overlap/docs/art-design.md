# Tower Overlap art direction

Original construction-yard artwork uses a pale scaffold and distant city silhouettes behind a growing tower. Stone slabs have beveled tops and textured faces; the moving slab is warm brass and completed floors cycle through muted masonry colors. Offcuts are separate pieces that rotate and fall after trimming.

The600unit horizontal field maps directly to600logical screen pixels. Alignment guides indicate the current top's edges and a transparent landing outline follows the moving slab's actual x/width. These are public geometry observations, not snapping or timing automation. Drop animation interpolates only vertical height from model dropElapsed; horizontal x stays locked.

The right panel shows built floors, remaining safe top width, current overlap width, actual current speed and the level's motion profile. A single prominent A DROP label explains the one-button interaction. The three public speed profiles are constant, alternating fast/slow and rising/falling. All logical text is at least24pixels.

Three original atlas tiles (construction yard, stone slab and plumb bob) are painted synchronously once. No external image, third-party art or hidden rule instrumentation is used. Matching64px SVG and Android vector depict a growing overlap tower.

Actual screenshots, motion recording and renderer performance require separate evidence; this document does not claim physical-device testing.
