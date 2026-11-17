# Rook Rescue — public model contract

The rules and public deterministic policy are fixed before implementation/tests. This document does not claim publication or completed verification.

## Position and legal moves

White player has one king K and one rook R; black AI has one king K. Three square boards have size5/6/7. Flat point IDs are row*size+column, zero-based. Public starts are (whiteKing,whiteRook,blackKing)=(18,20,11)/(0,11,18)/(39,11,3), with white move limits12/16/20. Pieces are distinct, kings are not adjacent, and black is not in check at each initial white-to-move position. There are no pawns, castling, promotion, repetition draw, fifty-move rule or territory scoring.

Kings move one square horizontally, vertically or diagonally. A white king move must be in bounds, land on an empty square, and stay more than one Chebyshev step from black king. Kings can never be adjacent or capture one another. The white rook moves a positive number of squares along one row or column. Neither king may be crossed; the rook cannot land on either king or capture the black king. A rook may move into a square attacked by black, risking its loss. White king safety cannot be supplied by the rook: king adjacency is forbidden regardless of a rook ray.

A rook attacks along its row/column up to the first intervening piece. For deciding whether black is attacked, white king blocks the rook ray. A legal black king destination cannot equal or neighbor white king. It may capture the rook only when that square is not protected by white king; after capture the rook is removed before checking attack. Any other black move must also avoid the rook's unblocked attack ray. No king capture is ever allowed.

## Goal, opponent and move limit

After one legal white move, first enumerate black's legal replies and whether black is currently attacked. No replies plus attack is checkmate and immediate player victory. No replies without attack is stalemate and player loss. In both cases black does not respond.

Otherwise black chooses deterministically:
1. If a legal destination captures the white rook, take it immediately.
2. Otherwise maximize legal black king mobility from each candidate resulting position, with both white pieces held fixed. Mobility is the count of legal black destinations under the same attack/capture rules; it includes a hypothetical safe rook capture if available.
3. Ties maximize squared Euclidean distance from white king: (rowBlack-rowWhite)²+(colBlack-colWhite)².
4. Remaining ties use the lowest row-major destination ID.

Apply this one black move synchronously. A captured rook is an immediate loss. Otherwise, if the white move limit has been reached without mate, lose. Thus mate, stalemate and rook capture all take precedence over budget exhaustion, and a mate on the last allowed move wins. This opponent uses only the public position and is not advertised as perfect play.

## Controls

Arrows move a bounded board cursor. A on either white piece selects it or switches the selection, without consuming a move. A elsewhere with a selected piece attempts that destination. An illegal destination preserves selection and consumes no move or AI reply. A on an empty/black square while no piece is selected is free blocked. B clears selection; B with no selection is a no-event free action. No wall-clock timer or held repeat. B > A > direction; dominant axis selects direction, vertical wins equal magnitudes.

After a legal move, selection clears, cursor remains at the white destination, and black resolves synchronously. Current legal targets for the selected white piece may be displayed; they are derived from ordinary chess rules, not a solution route.

## API and public state

Only create(seed,level), step(state,dt,input), deeply frozen config are exported. Config contains defaultSeed791,maxElapsed86400,maxCounter2147483647,aiPolicy,layouts. Layouts contain id/name/nameZh,size,whiteKing,whiteRook,blackKing,moveLimit and no solver or future moves. Seeds integer0..4294967295 accepted else791; level0..2 else0. Seed is recorded but does not alter boards or policy. Create returns independent state; step mutates and returns it.

State: schema,seed,level,phase,reason,score,size,whiteKing,whiteRook,blackKing,moveLimit,cursor,selected,legalTargets,blackInCheck,blackMobility,whiteMoves,blackMoves,lastWhite,lastBlack,receipts,elapsed,elapsedCapped,calls,blockedActions,inputArmed,cancelEpoch,cancelledLast,lastHeld,lastCommand,events,terminalReceipt,message.

Initially phase playing/reason empty/score0, cursor at whiteKing, selectednull, move counts0 and last movesnull. WhiteRook is an ID while present or null after capture. Selected is null/'K'/'R'. LegalTargets is a sorted detached array for that selected piece, otherwise[]. BlackInCheck and blackMobility always derive from the current position. After a surviving ordinary black reply BlackInCheck is false, because black moves must be safe.

LastWhite is {piece:'K'|'R',from,to}; lastBlack is {piece:'K',from,to,capturedRook:boolean}. LastBlack clears at each valid white move, so mate/stalemate has null black reply. Receipts append detached {turn,white,black,whiteKing,whiteRook,blackKing,blackInCheck,blackMobility,outcome,reason}, bounded by moveLimit. Won has score100/reason empty. Lost score0/reason rook-captured,stalemate or limit. TerminalReceipt is detached {cause,call,elapsed,level,whiteKing,whiteRook,blackKing,whiteMoves,blackMoves,moveLimit,blackInCheck,blackMobility,score,phase,reason}; cause mate/rook-captured/stalemate/limit. Terminal calls freeze every field before input inspection.

Events include call and at most one item: cursor {from,to}; select {piece,point}; cancel {piece}; blocked {reason:'boundary'|'no-piece'|'king-capture'|'movement'|'king-safety'|'blocked-ray'}; move {white,black}; win {cause,white,black}; collision {cause,white,black}. LastCommand b/a/up/down/left/right/none. No-event samples preserve message. Successful selections/switches do not count as white moves.

## Input lifecycle

Admit only finite numeric0<dt<=0.25. Invalid dt and terminal state are exact no-ops before reading input. Read only own data descriptors x/y/a/b/cancelEpoch/cancelled/paused on non-null non-array objects; ignore getters/inherited/unknown fields. Descriptor failure discards partial reads to neutral; nonthrowing Proxy traps may run. Literaltrue enables flags, finite axes clamp[-1,1], epoch is a nonnegative safe integer or ignored. Pausedtrue is an exact no-op.

Initially unarmed. A valid changed epoch after baseline or cancelledfalse→true disarms before commands. All cancelled samples suppress commands and preserve position/selection. A cancelled or disarming sample cannot rearm. Later noncancelled neutral input (a/bfalse, both axes magnitude<=0.5) arms future commands. Commands require armed at entry and fresh A/B edge or changed nonneutral direction. Held values are recorded even when suppressed. aPressed/bPressed are ignored; host isolation guarantees physical release after cancellation/disconnection.

Every admitted unpaused call advances bounded informational elapsed/calls, clears events/lastCommand and applies at most one command plus any resulting one black reply. Calls/blockedActions saturate maxCounter. Elapsed caps maxElapsed with sticky elapsedCapped; it never consumes the move budget.

## Evidence boundaries

Independent test-only attack/move generation and BFS must prove shortest wins requiring at least four white moves, and natural rook-capture/stalemate/budget losses for all starts. Do not import production move helpers. Normal claims use create/step input; synthetic safety/ray/mate fixtures are labelled. Browser keyboard/software rendering is not physical TV, phone or emulator evidence.
