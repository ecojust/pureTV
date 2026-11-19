# Original Backroad macOS draft upload: CI 44623552690

The fixed workflow at source `59fa240bd9733211cb5097dbb0df8ec945160dc0` succeeded. Its create-only receipt branch resolves to immutable commit `e8da7c3987d5cafa22da6dc052e30aeffa66ab7f`. The original receipt was recovered through the Git blob API and its Git SHA1, byte length and SHA256 were verified. Three actual executed helper/import hashes match the exact executor source; the workflow and tested helper fixture were also copied from that commit.

The two Release attachments were checked through both the specified release asset list and direct asset APIs against the receipt and fixed original package SHA256 values. Release `451969286` remained a draft with the original source/tag and exactly these two assets at recovery. No original large package was downloaded again. This recovery did not create, modify or publish a Release. Root handles final publication and public downloads separately.

Original package signature/source/native runtime acceptance is separate evidence. The prior original run failure is not overwritten by this successful byte upload. See `recovery-verification.json` for exact identities, actual asset IDs and hashes.
