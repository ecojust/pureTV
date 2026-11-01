# Thermal Glider model contract

UMD `PureModel` exports only `create(seed=1,difficulty=0)`, `step(state,dt,input)` and `TICK_HZ=60`. This is a bounded, deterministic point-mass gliding approximation, not full CFD. There is no engine, route script, forced landing, checkpoint-award or scoring hook. All course geometry and physics parameters are public.

## Coordinates, controls and state

World coordinates are meters: x increases right/east, z increases forward/north, altitude is height above the flat ground plane at zero. Heading is radians, zero along +z; positive heading turns right toward +x. Positive bank is right roll; positive pitch is nose-up. Joystick x controls target bank; **joystick y=-1 (up/W) raises the nose**, y=+1 lowers it. Targets are ±.55 rad bank and ±.18 rad pitch, approached smoothly with time constants .35 s and .28 s. There are no instantaneous heading snaps or grid repeats.

A is a held airbrake. B toggles the real `flaps` configuration on a rising edge. B is not pause and changes no position, altitude or airspeed instantaneously. Shared START/P pause/disconnection freezes the model by not calling step. Cancellation-owned input samples clear queued B edges and act as neutral controls while the active flight clock continues.

- `width=960,height=540`, `level` 1…3, `levelName`, `difficulty` 0…2; `phase` playing/won/lost.
- `glider={x,z,altitude,airspeed,heading,bank,pitch,vx,vz,groundSpeed,verticalSpeed,stalled,stallSpeed,stallTime,airbrake,flaps,thermalLift,sinkRate,radius:6,span:12,length:6}`. `vx/vz` are ground velocity in m/s. `thermalLift` is the field at the current position; `sinkRate` is the last tick's applied total passive/brake/stall sink. A glider is a point in the vertical dimension with a conservative 6 m horizontal circular collision envelope; its actual map wingspan is 12 m, not an oversized visual symbol's width.
- `world={xMin,xMax,zMin,zMax,groundLevel:0}`, `wind={x,z}` in m/s; wind advects position but is not airspeed or an energy source in this model.
- `thermals[]` contains `{id,x,z,radius,strength}`. Strength is peak upward air-mass velocity, m/s. `mountains[]` contains `{id,x,z,radius,height}`: solid, constant-height circular cylinders with vertical sides and a flat top, not cones or interpolated terrain.
- `rings[]`: `{id,x,z,altitude,radius,heading,passed}`. Each is a vertical circular aperture centered at the given height. Heading gives its horizontal forward normal `(sin(heading),cos(heading))`; it is **not** a ground disk trigger. `nextRing` is the zero-based required index, `checkpointsPassed` and `checkpointCount` track ordered progress.
- `runway`: `{x,z,heading,length,width,minAirspeed,maxAirspeed,maxGroundSpeed,maxSinkSpeed,maxBank,minPitch,maxPitch,maxHeadingError,maxTrackError}`. Its long axis follows heading. The full horizontal aircraft envelope must fit inside its rectangle.
- `landingStatus` exposes `inside`, `allRings`, `airSpeedOk`, `groundSpeedOk`, `verticalSpeedOk`, `bankOk`, `pitchOk`, `headingOk`, `trackOk`, `notStalled`, `headingError`, `trackError`, `along`, `across`, `ready`, and a specific `reason`. These are current-state readiness checks; they do not award a landing before actual ground contact.
- `landingResult` is null or the evaluated contact record with the contact position/speed/attitude, readiness flags and `accepted`. `collision` is null or `{type,id,fraction,at,x,z,altitude}` for the terminal physical contact.
- `flightMode` and `message` describe the **current** flight state (glide, thermal, airbrake, stall, approach, landed, crashed). Mode transitions refresh the footer; B/other action text cannot remain stale after leaving a condition. `flapToggles` counts genuine B edges.
- `tick`, `elapsed=tick/60`, `timeLimit=90`, `remaining`, `score`, `lostReason`; `events[]` is reset per step and capped at 32 entries.
- `physics` publishes gravity, response constants, bank/pitch limits, max airspeed, brake terms, bank/stall sink terms and both configuration polars. `initialEnergy`, `energy`, `thermalEnergyAdded`, `energyDissipated`, `energyError` use specific mechanical energy (m²/s²). `lastStep` exposes the applied tick/fraction and energy transfers for auditing; it contains no route information.

## Discrete, passive energy model

Each 1/60 s tick smoothly approaches commanded bank/pitch. Let v be the old longitudinal air-relative speed and p the resulting pitch. First calculate

`vRaw=max(0, v-g*sin(p)*dt)` and `dhPitch=(v²-vRaw²)/(2*g)`.

This transfers kinetic energy into height when pulling up, or height into speed when diving, with **exact discrete cancellation**. Away from a zero-speed clamp it equals the trapezoidal average-speed pitch-height integration. It cannot generate energy by alternating pitch. A zero-speed glider can accelerate again by lowering the nose.

Next cap speed at 32 m/s, then subtract held-airbrake deceleration 1.4 m/s², clamped at zero. The removed kinetic energy is dissipated, never converted to extra height. Neutral unbraked flight loses altitude through its positive sink polar while approximately retaining speed:

- Clean: best speed 18 m/s, minimum sink .70 m/s, quadratic coefficient .008, base stall speed 10.5 m/s.
- Flaps: best speed 14 m/s, minimum sink .58 m/s, coefficient .018, base stall speed 8.2 m/s.
- Polar sink is `minSink+coefficient*(averageAirspeed-bestSpeed)²`. Flaps improve low-speed lift/sink and stall margin, but increase drag/sink at high speed. They are not a second airbrake.
- Banking adds a nonnegative load-factor sink; airbrake adds 1.4 m/s extra sink. Effective stall speed is the selected base speed times `sqrt(1/cos(bank))`. Airspeed below it sets a genuine stall state with extra sink and reduced turning authority. Ordinary negative vertical speed alone is not a stall. Stalling does not magically kill a high aircraft; it loses height and may recover or actually hit terrain.

Thermal lift is sampled at the tick's starting world position. Inside a thermal of radius r it is `strength*(1-distance²/r²)`; at and outside the boundary it is zero. Overlapping fields add. There is no entry reward, stored lift bonus or pause-resume refill. Total height change is `dhPitch+(sampledThermal-totalPositiveSink)*dt`.

Heading turns smoothly at coordinated-turn rate `g*tan(bank)/max(averageAirspeed,8)`, reduced during stall. Horizontal displacement uses average airspeed, pitch and midpoint heading plus the public wind vector. The simplified energy ledger uses longitudinal airspeed and gravitational potential; it does not claim to model separate vertical kinetic energy or wind-work on the aircraft.

Every tick accounts for speed-cap/brake kinetic loss plus `g*positiveSink*dt` as dissipation, and `g*thermalLift*dt` as external thermal input. Thus `energy = .5*airspeed²+g*altitude = initialEnergy+thermalEnergyAdded-energyDissipated` up to floating-point roundoff. Mode toggles never change this ledger by themselves.

## Swept gates, terrain and landing

Each physics tick forms a straight swept position segment between its endpoints. Mountain contact uses the entire horizontal circle-overlap interval, expanded by the glider radius, intersected with the segment's `altitude<=mountain.height` interval. It catches endpoints outside a mountain, descending through its top after entering above it, and tangencies. Ground and world-boundary contacts also use their earliest swept fraction. The complete 6 m horizontal envelope must remain within the world rectangle. Equal-fraction contacts prioritize mountain, then world boundary, then ground: a simultaneous unsafe contact cannot become a successful landing.

Forward ring-plane crossings are sorted by their segment fractions. A crossing counts only if it is the next required ring, goes from the back toward its forward side, and the center's squared cross-track/height distance is within `(ring.radius-glider.radius)²`. Every ring counts once. Crossings at or after an earlier terrain/ground/boundary contact are rejected; a contact at exactly the same fraction has priority. Reverse/out-of-order passes do not count.

At the earliest physical contact fraction, x/z/height and **airspeed squared** are interpolated consistently; accumulated thermal/dissipation transfers use that same fraction. Bank and pitch use the corresponding contact fraction; heading uses the continuous tick turn increment before wrapping, never a linear interpolation between wrapped endpoints. Runway heading and ground-track errors use the shortest wrapped angular difference. This preserves the energy ledger without clamping a below-ground height upward for free. Ground velocity and landing tests are evaluated from this one contact state. `verticalSpeed` is the tick's actual height change divided by dt.

An actual downward ground contact wins only if every ring is already passed, the complete aircraft footprint lies in the runway rectangle, airspeed lies in the published interval, ground speed is below its limit, vertical speed is strictly negative and no lower than -maxSinkSpeed, bank/pitch are within limits, aircraft heading and ground-track heading align with the runway, and the aircraft is not stalled. A constructed state already on the ground contacts at fraction zero; a level or ascending state cannot earn a landing. There is no automatic glide-path capture, snapping to the runway or forced touchdown. Failure retains a specific contact/readiness reason. Mountain collision always loses; leaving the finite safe world loses. A normal descent away from a runway is a real ground collision, not a stall label.

## Time, scoring and retry

The 90-active-second deadline is checked before B/control integration, checkpoint credit or landing on that tick. Time expiry cannot be rescued by a last-tick landing. During flight/loss, score is `checkpointsPassed*300`; winning adds `1000+floor(remaining)*10`. Terminal calls freeze all state. A fresh retry has independent course arrays, unpassed rings, initial height/speed/attitude, clean configuration, no queued input, full time and zero energy-transfer ledgers.

Three authored courses use gentle lateral turns and visible thermal regions, sequential 3/3/4 rings and generous but finite runway rectangles. Their detailed geometry lives directly in public create-state; controllers must use those fields rather than level-specific route/time scripts. Normal-flight durations and independently verified controls will be recorded after validation.
