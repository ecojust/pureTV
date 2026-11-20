// Career win condition and final score. Pure: no DOM, no three. A track is passed by a top-three finish without a wreck (economy.js).
import { GAME_TRACKS } from './tracks/index.js';
import { earnedOf } from './economy.js';

/** The tracks a player must pass to win: the game's own tracks, the ones the track select lists. */
export const WIN_TRACK_IDS = GAME_TRACKS.map((t) => t.id);

/** True when every track in `trackIds` is in `passedTracks` (and there is at least one track). */
export function allTracksPassed(passedTracks = [], trackIds = WIN_TRACK_IDS) {
  return trackIds.length > 0 && trackIds.every((id) => passedTracks.includes(id));
}

/**
 * True when this finished race wins the career: every track is passed after it, and the win has not been shown on this save.
 * The flag (`winShown`) keeps the win to once per save, and also covers older saves that passed every track before winning existed.
 */
export function winDue(saveBefore, passedAfter, trackIds = WIN_TRACK_IDS) {
  return !saveBefore?.winShown && allTracksPassed(passedAfter, trackIds);
}

/**
 * The final score: career prize money + kill bonuses + contract net (bounties minus penalties). Spending does not lower it,
 * and a contract that failed can take it below the prizes. Money in the bank is shown separately (save.cash).
 */
export function careerScore(save) {
  const e = earnedOf(save);
  return e.prize + e.killBonus + e.contractNet;
}

/** What the final stats screen shows: money, the score and its parts, and the career counts. */
export function finalStats(save, trackIds = WIN_TRACK_IDS) {
  const passed = save.passedTracks || [];
  return {
    cash: save.cash,
    score: careerScore(save),
    earned: earnedOf(save),
    races: save.races,
    wins: save.wins,
    kills: save.kills,
    tracksPassed: trackIds.filter((id) => passed.includes(id)).length,
    tracksTotal: trackIds.length,
    champion: allTracksPassed(passed, trackIds),
  };
}
