export const TV_KEYS = ['UP','DOWN','LEFT','RIGHT','START','A','B','X','Y'] as const;
export type TVKey = typeof TV_KEYS[number];
export interface TVFrame {
  buttons: Partial<Record<TVKey, boolean>>;
  pressed: Partial<Record<TVKey, boolean>>;
  cancelled?: boolean;
}
