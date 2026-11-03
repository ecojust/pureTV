# Domino Chain — public model contract

This document fixes public rules, data and test boundaries before execution; it does not claim completed verification or publication.

## Public tiles and deals

The double-six set has 28 unique unordered tile IDs: enumerate a=0..6, then b=a..6, assigning ascending IDs. A tile is {id,a,b}; doubles are ordinary tiles with a=b. Every authored deal uses distinct IDs across both hands, the ordered draw pile and one starting chain tile. Unused set tiles do not enter play. Both hands and every remaining draw tile are visible in their actual order. There is no hidden state or random dealing.

Three layouts contain 5/6/7 tiles per initial hand and 3/4/5 draw tiles. Public layout fields are id/name/nameZh, playerHand, aiHand, drawPile and start. Starting chain orientation is tile.a on the left, tile.b on the right. Test-only search must prove ordinary victory and natural loss routes in all three, with every victory requiring at least three human plays. No routes or answer tables ship in assets.

## Playing, drawing and passing

Left/right selects a player-hand index, clamped at the ends. Up chooses the left chain end; down chooses the right chain end. A plays the selected tile if either face matches that chosen end, automatically orienting the matching face inward. A double keeps that endpoint's number unchanged. Illegal selected-end A is free and never invokes AI.

B is allowed only if no tile anywhere in the player's hand can match either end. If the pile is nonempty, draw its first tile, append it to the hand and focus that new index; drawing retains the player's turn and resets consecutive passes. If the pile is empty, B passes and invokes the opponent unless this second consecutive pass settles the game. A legal play resets consecutive passes. At most one human command per admitted input sample; B > A > direction. Dominant axis chooses direction and vertical wins equal magnitudes. No held repeat.

Player empty hand wins immediately after play, before any AI response. Otherwise AI responds to a player play or proper pass. AI selects the legal tile with greatest pip sum, ties by smallest tile ID, then chooses left before right if that tile fits both. With no legal tile it repeatedly draws the first public pile tile until a legal play exists or the pile is empty. Draws reset consecutive passes. With empty pile and no play it passes. Exactly one AI play or proper pass ends its synchronous response; at most the original remaining pile count draws precede it. Empty AI hand loses for the player immediately after the AI play.

Two consecutive proper passes with an empty pile settle by remaining hand pip sums: strictly lower player sum wins, higher loses, equal is an unsuccessful tie. No early comparison while a playable turn remains. Planning has no timer. Every successful draw consumes a finite pile tile; every play consumes a hand tile; a pass either precedes an opponent play or ends the game, so natural play is bounded.

## Orientation and state

Chain items are {id,left,right,owner}, owner 0 initial / 1 player / 2 AI. Neighbor faces always match. Left insertion has item.right equal to the old left endpoint; right insertion has item.left equal to the old right endpoint. Initial chain contains one public start item. All played IDs stay in the full chain; renderer may compress the middle while preserving both endpoints and total count.

Only create(seed,level), step(state,dt,input), deeply frozen config are exported. Config includes defaultSeed 777, maxElapsed 86400, maxCounter 2147483647, tiles, layouts and aiPolicy text. Seeds accept integer 0..4294967295 else 777; level 0..2 else 0. Seed is recorded but does not alter the deals or AI. create returns fresh detached state; step mutates and returns it.

State: schema,seed,level,phase,reason,score,playerHand,aiHand,drawPile,chain,cursor,end,passStreak,playerPips,aiPips,playerPlays,aiPlays,playerDraws,aiDraws,playerPasses,aiPasses,actions,lastPlayer,lastAI,aiTrail,receipts,elapsed,elapsedCapped,calls,blockedActions,inputArmed,cancelEpoch,cancelledLast,lastHeld,lastCommand,events,terminalReceipt,message.

Initial cursor 0, end right, passStreak 0; counts/actions 0; phase playing/reason empty/score 0. Pip totals derive from actual hands and update after each successful draw/play. Removal clamps cursor to the new hand length (0 for empty). State hands preserve their public initial order, remove played IDs in place and append drawn IDs. AI ranking is independent of hand order.

lastPlayer and lastAI are null or action objects: {type:'play',tile,end,oriented:{left,right}}, {type:'draw',tile}, or {type:'pass'}. aiTrail is the detached list of AI actions in the latest response. Every valid human play/draw/pass clears lastAI/aiTrail first; free invalid commands preserve them. actions counts valid human actions. receipts appends detached {action,player,ai:[actions],left,right,playerCount,aiCount,playerPips,aiPips,passStreak,outcome,reason}. Natural receipt count is below 64 for the authored deals. No receipt shares mutable data with state or other receipts.

Won has score 100/reason empty. Lost has score 0/reason ai-empty, blocked-loss or blocked-tie. TerminalReceipt is detached {cause,call,elapsed,level,playerHand,aiHand,drawPile,chain,playerPips,aiPips,passStreak,actions,playerPlays,aiPlays,score,phase,reason}; cause player-empty, ai-empty, blocked-win, blocked-loss or blocked-tie. Terminal state freezes before reading input.

Events include call and at most one item: cursor {from,to}; end {from,to}; blocked {reason:'boundary'|'mismatch'|'legal-play-exists'}; turn {player,ai}; win {cause,player,ai}; collision {cause,player,ai}. LastCommand b/a/left/right/up/down/none. A no-event call preserves message.

## Input lifecycle

Admit only finite numeric 0<dt<=0.25. Invalid dt or terminal state is an exact no-op before reading input. Own data descriptors x/y/a/b/cancelEpoch/cancelled/paused are read on non-null non-array objects. Getter/inherited/unknown fields are ignored; descriptor failure discards partial reads to neutral. Nonthrowing Proxy traps may run. Booleans require literal true, finite axes clamp [-1,1], epoch is a nonnegative safe integer or ignored. Paused true is an exact no-op.

Initially unarmed; a noncancelled neutral sample arms future commands. A changed valid epoch after baseline or false→true cancelled edge disarms before commands. Every cancelled sample suppresses commands, preserves selection and game position, and cannot rearm. A disarm sample cannot rearm. A later neutral sample (a/b false, both axis magnitudes <=0.5) is required. Commands require armed at entry; held values are always recorded, including suppressed commands. A/B require rising edges; direction requires a changed nonneutral direction. aPressed/bPressed are ignored. The host enforces physical release and phone-disconnection isolation.

Each admitted unpaused call advances bounded informational elapsed and calls, clears events/lastCommand, then applies at most one human command and its bounded AI response. Calls/blockedActions saturate maxCounter. Elapsed caps maxElapsed with sticky elapsedCapped; it never determines victory or defeat.

## Evidence boundaries

Independent test-only search uses only the public deal and exact AI policy. Ordinary results require create/step inputs; synthetic doubles/orientation/tie fixtures are labelled separately. Browser keyboard and software-rendering checks do not claim physical TV, phone or emulator testing.
