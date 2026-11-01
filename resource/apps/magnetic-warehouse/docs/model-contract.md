# Magnetic Warehouse model contract

The UMD `PureModel` exports `create(seed=1,difficulty=0)`, `step(state,dt,input)`, and `TICK_HZ=60`. `step` mutates a serializable state; `difficulty` 0/1/2 chooses an authored layout. There are no solution, undo, or forced-outcome APIs. Ordinary R retry belongs to the shared runtime and calls `create` again.

## Coordinates and public state

Canvas units are 960×540. `grid={cols:13,rows:9,cellSize:44,x:194,y:72}`. Tile `(col,row)` has center `(194+(col+.5)*44,72+(row+.5)*44)`. All movement is discrete one-cell movement, with no physical collision radius. Artwork may interpolate the display, but never changes state or draws a piece outside its actual tile as a rule.

- `cells[]`: fixed row-major `{id,col,row,x,y,type,dockId}`. `type` is `wall`, `floor`, or `scrap`; `dockId` is null or the integer dock number. The entire puzzle is visible.
- `player`: `{col,row,x,y,polarity,facingX,facingY}`. Polarity is +1 or -1; initially +1.
- `crates[]`: `{id,col,row,x,y,polarity,docked}`. Integer IDs are 1…N. `docked` requires the exact same numbered dock, independently of polarity.
- `docks[]`: `{id,col,row,x,y,occupiedBy,matched}`. `occupiedBy` is null or the actual crate ID. A wrong numbered occupant is not a match. Docked crates remain movable.
- `level` is 1…3, `difficulty` is 0…2; `levelName`, `target`, and `matched` describe progress. `width=960`, `height=540`.
- `actionsUsed`, `actionBudget`, `actionsRemaining`, `moveCount` (successful moves), `blockedMoves`, `flipCount`, `pulseCount`, `attractedMoves`, `repelledMoves` (actual crate steps), and `blockedPulses` (B actions moving no crates).
- `tick`, `elapsed=tick/60`, `timeLimit=90`, `remaining=max(0,90-elapsed)`.
- `phase` is `playing`, `won`, or `lost`; `lostReason` is null, `scrap`, `actions`, or `timeout`. `message` gives feedback; `score` is defined below.
- `events[]` is reset for each `step` and bounded to 32 entries. Entries have `type`, `tick`, and action-specific fields. `lastAction` contains the latest logical action/blocked attempt. No unbounded move history is retained.
- `pulse` is null or the latest visible pulse, lasting 0.45 s: `{id,createdAt,expiresAt,polarity,origin:{col,row,x,y},targets:[{crateId,fromCol,fromRow,toCol,toRow,mode,moved,reason}]}`. `mode` is `attract` or `repel`; reason is `moved`, `wall`, `player`, `conflict`, `occupied`, or `cycle`. Only actually aligned, wall-visible crates occur in targets. Source and target coordinates remain fixed after emission. Empty pulses have an empty targets array. Render field paths only from this event, not invented rays through occluding walls.

## Input and action order

Input is `{x,y,a,b,aPressed,bPressed}`. Values are sanitized and clamped; movement below 0.25 on both axes is neutral. Choose the larger absolute axis; ties choose horizontal. A new nonzero direction moves immediately; the first held repeat occurs 20 ticks later (1/3 s), then subsequent repeats occur every 10 ticks (1/6 s). Releasing or changing direction resets the initial 20-tick delay. A blocked first attempt also uses the 20-tick delay; later blocked repeats use 10 ticks.

A flips player polarity. B emits a magnetic pulse. Each responds only to a genuine rising held-state edge or an explicit pressed edge, not a held button. An edge arriving before a full fixed tick is cached until the next tick. If A, B and a movement are presented together, execute **A, then B using the new polarity, then movement**. Each is an atomic action; terminal evaluation after each action prevents later actions from occurring after a win/loss. This order is deterministic and may spend up to three actions in a tick.

Only successful movement spends one action. Attempts to enter a wall, crate, scrap tile or outside the board do not spend an action; the repeat cooldown and real clock still advance. A and B always cost one action, including a pulse that moves no crates, with explicit feedback. There is no force pushing. The robot refuses to enter marked scrap chutes; magnetic crates can be moved into them and are lost.

## Magnetic pulse resolution

The pulse acts on every crate in the player's row or column with no wall strictly between player and crate. Range extends to the board edge. Walls block the field; other crates, docks and scrap do not. Opposite polarity attracts one cell toward the player; equal polarity repels one cell away. Every proposal is computed from the same pre-pulse positions.

1. A destination outside the board, in a wall, or occupied by the player is blocked.
2. If multiple proposals choose one destination, all those proposals are rejected; none wins by array order.
3. Entering an occupied crate tile requires that occupant's proposal to succeed. A chain ending in an empty tile can move simultaneously. A chain ending in a blocked/stationary crate cannot move.
4. Swaps and longer dependency cycles are rejected, and rejection propagates to dependent crates. No crate can overlap, tunnel through a wall, or pass another crate.
5. Apply all accepted one-cell moves together. Any crate entering a marked scrap tile loses the round immediately, even if other crates reached docks in the same pulse.

Map arrays and crate order never determine conflict winners. A pulse is a discrete simultaneous rule, not a continuous inverse-square force approximation.

## Terminal rules and scoring

The 90 s deadline is checked at the start of every physics tick, before pending actions. Thereafter each atomic action checks: scrap loss, then all exact numbered docks matched (win), then zero actions remaining (loss). Thus the final available action may win; an action at or after the deadline cannot rescue an expired round. A failed walking attempt cannot deplete action budget. Pausing/disconnection is handled by the shared runtime not calling `step`.

While playing, score is `matched*300` and may decrease if a crate leaves its dock. On a win add `500 + actionsRemaining*10 + floor(remaining)*5`. On a loss keep `matched*300`; there is no automatic partial reward for wrong docks. Terminal `step` calls leave the entire state unchanged. A fresh retry restores independent arrays, starting positions, polarity, budgets, counters, timer and pulse.

The layouts are `双极入库`, `三箱转运`, and `四箱协同`, with 2/3/4 crates and 100/130/160 actions. The divider at column 6 has passages at rows 4; 3 and 6; or 2 and 6, respectively. Later layouts add a sideward crate transfer and a fourth crate requiring two-axis transport. Each starts unsolved and contains explicitly visible scrap cells. First-map crate 1 begins against the top wall and must be attracted out; crate 2's top-edge dock requires a final repelling step. Verification retains normal-input routes only in tests/scratch, never in the production model.

Initial ordinary-key route verification used one action followed by released inputs for an 80-tick inspection interval. It completed the three layouts in 24/26/52 paid actions and 30.683/33.350/68.017 s, respectively. All three routes contain actual polarity flips, attracting crate moves and repelling crate moves. The production game does not impose this demonstration cadence: players can act sooner, and their deliberation time still uses the 90-second clock. These are feasible examples, not claims of shortest solutions or success for arbitrary input timing.
