# Four in Row — public model contract

Public rules and AI policy fixed before implementation/execution. This file does not claim passed checks or publication.

## Board, goal and prepared positions

The board is7columns ×6rows. Rows run top0 to bottom5; cells are0empty,1player,2AI. A token falls into the lowest empty row of its selected column. Four or more contiguous equal tokens horizontally, vertically or on either diagonal wins. Player always moves first from each prepared endgame. The goal is a player win; an AI win or a full-board draw is unsuccessful.

Three visible authored boards have10/12/14 empty cells. Each has equal player/AI token counts, legal gravity, no existing four-in-row and an ordinary alternating nonterminal move prefix recorded only in tests/initial-prefixes.json. Those prefixes prove reachability and contain no future solution.

| Level | id / English | 中文 | Top-to-bottom rows |
| --- | --- | --- | --- |
| 0 | harbor-line / HARBOR LINE | 港湾残局 | 2200200 / 1200100 / 2101201 / 1121222 / 2112111 / 1222121 |
| 1 | cross-current / CROSS CURRENT | 交错残局 | 1000020 / 2100112 / 2200211 / 2200121 / 1102121 / 1121222 |
| 2 | deep-fork / DEEP FORK | 深叉残局 | 2100001 / 2100002 / 1200002 / 1201121 / 1102212 / 2121212 |

Left/right chooses a column, clamped at0..6. A drops one player token. Full-column A blocks free and does not invoke AI. B/up/down do not act. A has priority over a simultaneous horizontal edge; B does not override it. No held-repeat. All information is visible.

## Exact deterministic AI policy

After a legal player drop, check player victory first, then full-board draw. Only if neither settles does AI drop one token synchronously. Check AI victory next, then full-board draw. There is no AI response after a player win.

Tie order is [3,2,4,1,5,0,6]. Legal columns are those with an empty top cell. AI chooses:
1. First column in tie order that immediately wins for AI.
2. Otherwise first column in tie order in which a hypothetical player drop immediately wins, blocking that threat. If multiple threats exist, the same stable priority applies.
3. Otherwise a depth3 minimax search including the candidate AI move. For each candidate, evaluate the resulting board with player to move and depth2. A player node minimizes, an AI node maximizes; every move decrements depth. Candidate ties retain the first tie-order column.

Minimax checks terminal states before depth exhaustion: AI win scores1000000+remainingDepth; player win scores−1000000−remainingDepth; full draw scores0. At depth0 use the public static evaluation:
- Center column3 contributes +6 per AI token and−6 per player token.
- For every length4 window in all four directions, a window containing only AI and empty cells scores1/6/40 for1/2/3 AI tokens; a window containing only player and empty cells scores−1/−7/−45 for1/2/3 player tokens.
- Mixed and all-empty windows score0. Four-token windows have already been handled as terminal.

All69 windows are the straight length4 geometry. Search has no hidden information, randomness, time budget, persistent learning or answer table. It is an explicit modest opponent, not an optimal-play claim.

## API and state

Expose only create(seed,level), step(state,dt,input), deeply frozen config via CommonJS/window.PureModel. Config includes defaultSeed767,columns7,rows6,maxElapsed86400,maxCounter2147483647,ai:{depth:3,tieOrder,terminalScore:1000000,centerWeight:6,ownWeights:[0,1,6,40],opponentWeights:[0,1,7,45]},layouts. Layouts hold id/name/nameZh and rows strings only.

Seeds integer0..4294967295 accepted, otherwise767; levels0..2, otherwise0. Seed is recorded without changing boards or AI. Each create returns fresh independent data; step mutates and returns it. No solver/AI helper/state setter is exported.

State: schema,seed,level,phase,reason,score,board,column,playerDrops,aiDrops,lastPlayer,lastAI,winningCells,turnReceipts,elapsed,elapsedCapped,calls,blockedActions,inputArmed,cancelEpoch,cancelledLast,lastHeld,lastCommand,events,terminalReceipt,message.

Initial board is a detached integer matrix; column3; phase playing/reasonempty/score0; drop counts0; lastPlayer/lastAI null; winningCells[]; receipts[]. A last move is {row,col}. Playing is always ready for a player action because AI resolves synchronously. Player win is phasewon/reasonempty/score100. AI win and draw are phaselost/reasonopponent or draw/score0. Terminal state freezes.

A completed turn appends detached {turn,player,ai,outcome,reason}; turn is one-based playerDrops, player is current player placement, ai is the responding move or null. Receipts are bounded by7 human turns for these prepared boards. LastPlayer/lastAI share no object with receipts. LastAI is cleared at the start of each valid player drop, so a winning player turn has lastAI null. WinningCells is the sorted union of cell IDs row*7+col in every winning length4 window of the winner; empty on draw.

Calls/blockedActions saturate2147483647. Informational elapsed caps86400 with sticky elapsedCapped; no deadline. Current events has at most one item. TerminalReceipt independently captures {cause,call,elapsed,level,board,playerDrops,aiDrops,lastPlayer,lastAI,winningCells,score,phase,reason}; cause success/opponent/draw.

## Input and event order

Only finite numeric0<dt<=.25 is admitted. Invalid dt and terminal calls are exact no-ops before input inspection. Normalize own data descriptors x/y/a/b/cancelEpoch/cancelled/paused on nonnull nonarray objects. Ignore getters, inherited/unknown fields; descriptor failure discards partial reads to neutral. Nonthrowing Proxy traps may run. Only literaltrue enables booleans; finite axes clamp[-1,1]; cancelEpoch is a nonnegative safe integer or ignored. Normalized pausedtrue is an exact no-op.

Horizontal direction is right if x>.5, left if x<−.5, otherwise neutral; y does not alter horizontal selection. New A edge takes priority over a changed horizontal direction. Up/down/B have no action but must be released to a neutral sample after cancellation. Neutral rearming means a/b false and both axis magnitudes<=.5. Held unchanged A/directions do not repeat; direct left↔right changes create new edges. aPressed is ignored.

Initially unarmed, needs an admitted noncancelled neutral sample. A changed valid epoch after baseline or false→true cancelled disarms before commands. All cancelled samples suppress commands. A disarm call cannot rearm; a later neutral noncancelled sample is required. Commands require armed at entry. Every admitted call records held values, including suppressed edges. The host establishes physical release and phone absence.

Each admitted unpaused call advances bounded time/calls, clears events/lastCommand, and applies at most one command. Events include call:
- cursor {from,to}
- blocked {reason:'boundary'|'full-column'}
- turn {player,ai}
- win {player,ai:null}
- collision {reason:'opponent'|'draw',player,ai}

No-event calls preserve message; invalid/paused/terminal preserve all state.

## Evidence

Independent test-only search must derive the AI policy from these public rules and prove playable wins and natural losses. Ordinary run claims use create/step inputs. Synthetic win/draw/boundary boards are separately labelled. Browser keyboards and software rendering do not claim physical TV/phone/emulator execution.
