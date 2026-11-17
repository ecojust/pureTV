# Stack Dispatch visual design

Original procedural warehouse art uses warm brass gantry equipment, deep teal masonry, timber pallets and eight individually numbered containers. Color supplements the crate numbers; neither selection nor cargo identity depends on color alone.

The 960 × 540 logical stage reserves a top delivery manifest, a separate crane inventory readout, an overhead moving trolley and four work stations. The inbound station shows its next full-size crate followed by the remaining queue in reading order. Three bays show literal bottom-to-top stack order, fixed-capacity outlines and a TOP label at the only accessible crate. The selected station has a gold frame and its physical crane overhead. The held crate stays visibly suspended above that station. All stage text is at least 24 logical pixels.

The manifest green frame identifies the next required delivery. Shipped entries become muted and receive a check mark. The crane inventory remains explicit when empty. The bottom ribbon names the current A operation, B dispatch, selection controls and delivered count. Chinese instructions, current station and resource balances use the common DOM interface.

Only the warehouse, container, trolley and pallet are custom atlas sprites. They are synchronously painted once from Canvas vector paths into the common texture atlas; gameplay uses sprite batching and simple lines. No third-party artwork, remote assets, hidden answer overlay or state mutation is included. The 64 × 64 SVG and Android vector are matching original crane/container emblems.

Visual verification must use actual screenshots after construction. This design record is not a claim of completed browser, Android or physical-device testing.
