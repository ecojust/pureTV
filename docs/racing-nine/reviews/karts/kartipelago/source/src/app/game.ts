/**
 * What every screen can reach: the renderer, audio, settings, records, the menu picks,
 * and the screen manager. Built once in main.ts.
 */
import type { AudioEngine } from "../audio/engine";
import type { UiSounds } from "../audio/uiSounds";
import type { Input } from "../core/input";
import type { RacerId } from "../render/racers/designs";
import type { TrophyCup } from "../game/trophy";
import type { Stage } from "../render/stage";
import type { UiLayer } from "../ui/layer";
import type { MenuInput } from "./menuInput";
import type { ScreenManager } from "./app";
import type { Settings } from "./settings";
import type { SessionContext, SessionOptions, Session } from "../game/session";
import type { TrackMode } from "../game/tracks";
import type { AdventureState } from "../adventure/run";
import type { OverworldState } from "../screens/overworld";

export interface Selection {
  racer: RacerId;
  trackId: string;
  /** The world picked on World Select (track select lists its tracks). */
  worldId?: string;
  mode: TrackMode;
}

export interface Game {
  stage: Stage;
  ui: UiLayer;
  menuInput: MenuInput;
  gameInput: Input;
  audio: AudioEngine;
  sounds: UiSounds;
  screens: ScreenManager;
  settings: Settings;
  /** Save settings and apply them everywhere (audio, video). */
  applySettings(): void;
  selection: Selection;
  /** Build a race session (throws if its track can't load). */
  createSession(opts: Omit<SessionOptions, "lookMode">): Promise<Session>;
  sessionContext: SessionContext;
  /** The open race, if any (for the dev server's track reload). */
  session?: Session;
  /** ?debug: developer extras. */
  debugMode: boolean;
  /** The Trophy Race in progress, if any (game/trophy.ts). */
  trophy?: TrophyCup;
  /** Adventure mode: the save, and the race being run for the story (src/adventure). */
  adventure?: AdventureState;
  /** In the overworld (screens/overworld.ts): a race goes back to the region after. */
  overworld?: OverworldState;
}
