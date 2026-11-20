# Last Track Android attempt 3

Original run `44606071748`, attempt 1, source `c5ad63e8c6a0ccfada5f763d1d26afa27f45002e`, fixed export `35fca55f5a05d38785fb531004eca9add6913f04`. Both original modes failed. See `findings.json` for the exact focus/key/release/ACK timeline and `recovery-validation.json` for 64 copied original files independently verified against Git blobs and export hashes.

Normal mode completed installation, SDK connection, settings focus and settings open. Before LEFT to LOW all buttons were released and the focus was MED. LEFT was acknowledged; then all remaining pings lacked ACK, observation failed with connection refused, and ADB reported the emulator missing. Occupied mode failed its initial device wait before installation or gameplay. These records do not establish a Last Track menu defect or a unique device-loss cause. No game or QA-plan fix is justified by this evidence.

The original runtime job log is preserved; its earlier boot-time ColorBuffer errors preceded a subsequently successful boot/install and are not treated as the proven cause. No new workflow, model/clock mutation, or gameplay rerun was performed.
