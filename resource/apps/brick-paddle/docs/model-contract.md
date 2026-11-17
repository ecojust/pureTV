# Brick Paddle — public physics contract

Written before implementation. Clear every brick with a ball and a horizontally controlled paddle. Three authored layouts contain6,8,10 bricks; later layouts have respectively2 and3 bricks with two hit points. There is no timer. Every live brick and its current/max hit points are public; no scripted hits, hidden target route or gameplay solver exists in assets.

## Coordinates and layout

The field is720×450. The paddle stores center x, top y410, width120,height14,speed480 units/s. Its center clamps to60..660. Ball radius8; attached center `(paddle.x,400)`. A fresh round has3 lives and the ball attached. A launches it at vx96,vy−sqrt(320²−96²). In-flight speed stays320. Left/right axis held continuously moves the paddle; A requires a fresh rising edge. B and vertical motion have no gameplay action.

All bricks are104×28, horizontal gap12, rows y60 and108. Each layout has3/4/5 columns, centered across the720-wide field; id is row-major. All first-layout bricks have1 HP. In layout2, ids1 and6 have2 HP. In layout3, ids0,4 and7 have2 HP. Distinct sprites/HP numerals communicate remaining strength.

## Contacts and lives

Integrate dt in ceil(dt/(1/240)) equal substeps. At speed320, one substep travels at most1.334 units, less than radius8 and brick thickness28. Paddle movement is integrated on the same substeps. Side walls are x8/712, top y8; reflect the exceeded position and corresponding velocity component. There is no bottom wall.

Paddle contact uses circle-versus-rectangle geometry and only the top-facing surface while the ball descends. On contact, set ball.y=paddle.y−radius−epsilon. Horizontal impact ratio is clamp((ball.x−paddle.x)/(width/2),−1,1). Rebound vx=320×.85×ratio and vy=−sqrt(320²−vx²); thus moving the paddle changes the return angle. No random angle is added.

Brick contact uses the closest point of its axis-aligned rectangle to the circle. Corner normals are radial; an embedded-center synthetic case uses the nearest face. Only approaching contacts (dot(velocity,normal)<0) damage bricks. Every simultaneously approached overlapping brick loses exactly1 HP; combine their incoming-speed-weighted normals, reflect velocity once, and move the ball out along that normal, then make two separating passes over residual rounded-corner overlaps. This avoids double-reflecting a shared row/corner impact. A surviving2-HP brick is not damaged repeatedly while the ball travels away. After any collision normalize to speed320; if abs(vy)<80, clamp it to80 with its current sign (zero defaults upward) and set abs(vx)=sqrt(320²−80²), preserving horizontal sign (zero defaults right). This prevents endless almost-horizontal grazing.

A ball whose entire circle passes below the field (y−radius>450) loses one life. With lives remaining, reattach to the current paddle and zero velocity. Held A does not automatically relaunch; it must be released and pressed again. On the third miss, lose (`phase:lost`,reasonlives,score0). When the last brick is destroyed, win immediately (`won`,reasonempty,score100). Terminal step calls are exact no-ops. During attached time the ball follows paddle movement. There is no automatic serve.

## API and state

Expose only create(seed,level),step(state,dt,input),deeply frozen config through CommonJS or window.PureModel. Config has defaultSeed765,fieldWidth720,fieldHeight450,paddleWidth120,paddleHeight14,paddleY410,paddleSpeed480,ballRadius8,ballSpeed320,launchVx96,minVerticalSpeed80,maxHorizontalRatio.85,maxSubstep1/240,epsilon.0001,maxElapsed86400,maxCounter2147483647,initialLives3 and layouts `{id,name,nameZh,bricks:[{id,x,y,w,h,hp,maxHp}]}`. Config contains no future states or controller. Seed uint32 else765; level integer0..2 else0.

State: schema1,seed,level,phase,reason,score; paddle `{x,y,width,height,speed}`,ball `{x,y,vx,vy,radius,attached}`,bricks detached copies; lives3,remaining countalive,hits0,launches0,paddleHits0,wallHits0,misses0,terminalReceiptnull. Hits counts HP removed, not merely destroyed bricks. Terminal detached receipt is `{phase,reason,score,lives,remaining,hits,launches,paddleHits,wallHits,misses,paddle,ball,bricks}`. No mutable state/config/receipt aliases exist. Public events at most8 per admitted call retain the most recent launch/wall/paddle/brick/life/win/collision events; event truncation does not alter physics or counters.

Other fields: calls/launches/paddleHits/wallHits saturate2147483647; elapsed0 saturates86400,elapsedCapped sticky, informational; inputArmedfalse,cancelEpochnull,cancelledLastfalse,lastHeld `{a:false,b:false,direction:'none'}`,events[],message. Legal play bounds lives0..3, HP0..maxHp and hit counts. Coordinates/velocities remain finite. External malformed/mutated states are unsupported; physics boundary fixtures are explicitly synthetic.

## Time and input gate

Only finite numeric0<dt<=.25 is admitted. Invalid dt, pausedtrue and terminal calls are exact no-ops. Own data descriptors x,y,a,b,cancelEpoch,cancelled,paused only; accessors/inherited fields ignored. Descriptor/classification failures discard the whole input to neutral; nonthrowing Proxy traps may run. Finite axes clamp[-1,1], other values0; booleans literaltrue, epoch nonnegative safe integer. Ignore pressed flags.

A fresh neutral sample arms controls. First valid epoch establishes baseline; later epoch changes or false→true cancelled edges disarm before control. That call cannot rearm; a subsequent noncancelled full-neutral sample rearms. Save held state even while suppressed. Once armed, horizontal input is continuous, independent of A; unchanged A never repeats. B/y do not command but participate in full-neutral rearming. Cancelled/unarmed calls suppress paddle input and launching while in-flight physics continues; pausedtrue freezes everything. The shared host supplies real key-release quarantine and pauses on disconnection.

## Verification

Test all three ordinary public-input controller wins, wall/top/corner/paddle/brick contacts, simultaneous brick contacts,2-HP separation, maximum-dt no tunneling, life exhaustion and fresh relaunch, fixed-speed bounds, meaningful dt partition equivalence, cancellation/hold/pause and terminal freeze. Keep synthetic geometry fixtures separate from ordinary model play and actual browser keys. Browser steering reads public snapshots only; no clock/state injection. Record full ordinary wins and report real-device limitations honestly.
