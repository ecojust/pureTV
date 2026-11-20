/** The original coastline, tunnel and bridge are dressed from normalized track stations.
 * Each additional circuit supplies a closed curvature schedule (metres, degrees),
 * a height profile (lap fraction, metres), banking (degrees) and boost strips.
 */
type Keys = [number, number][];
export interface BoostStrip { t0: number; t1: number; lat: number; hw: number }
interface Circuit {
  id: string;
  name: string;
  banner: string;
  seed: number;
  heading: number;
  legs?: Keys;
  elevation?: Keys;
  bank?: Keys;
  halfWidth?: Keys;
  boosts?: BoostStrip[];
}

export const circuits: Circuit[] = [
  { id: 'sunset-bay', name: 'Sunset Bay Circuit', banner: 'SUNSET BAY', seed: 0xbacafe, heading: 45 },
  {
    id: 'cape-crown', name: 'Cape Crown Circuit', banner: 'CAPE CROWN', seed: 0x69c04e, heading: 75,
    // A long opening sweeper, a climbing switchback and a fast bridge return.
    legs: [[190,-7.60],[160,-84.72],[120,39.36],[100,-65.91],[160,-48.04],[140,-25.93],
      [100,35.58],[160,-79.61],[130,37.85],[150,-47.51],[180,-93.16],[180,-8.47],[150,-11.83]],
    elevation: [[0,4],[.09,5],[.18,9],[.26,17],[.34,30],[.43,49],[.50,46],[.56,39],
      [.64,22],[.73,7],[.79,12],[.86,26],[.91,22],[.96,11],[.99,4.5]],
    bank: [[0,0],[.09,1],[.15,9],[.21,-4],[.27,8],[.36,6],[.43,3],[.49,-4],[.53,4],
      [.58,11],[.64,-4],[.71,5],[.79,14],[.85,5],[.93,2],[.98,0]],
    halfWidth: [[0,8.8],[.11,8.5],[.23,7.4],[.35,6.6],[.43,5.6],[.53,6.3],
      [.64,7.4],[.79,8.7],[.90,7.1],[.97,8.0]],
    boosts: [{t0:.32,t1:.333,lat:1.8,hw:2},{t0:.565,t1:.579,lat:-1.9,hw:2},
      {t0:.928,t1:.945,lat:0,hw:3}],
  },
  {
    id: 'marina-esses', name: 'Marina Esses', banner: 'MARINA ESSES', seed: 0x31b4a8, heading: 15,
    // Alternating dockside corners lead into a long left at the tunnel entrance.
    legs: [[200,-6.34],[130,-99.01],[100,35.83],[120,-62.87],[120,36.41],[175,-106.34],
      [70,20.86],[100,-12.21],[110,-72.49],[144,44.75],[108,-80.68],[124,-28.65],[80,16.56],[100,-45.82]],
    elevation: [[0,4],[.10,5],[.18,6],[.26,12],[.32,9],[.40,16],[.48,29],[.55,26],
      [.60,20],[.69,8],[.76,6],[.84,14],[.91,18],[.97,8],[.995,4.1]],
    bank: [[0,0],[.10,1],[.16,11],[.23,-5],[.29,8],[.35,-4],[.40,3],[.46,13],[.52,-3],
      [.58,3],[.63,11],[.69,-4],[.74,-5],[.79,13],[.86,6],[.92,-3],[.96,6],[.99,0]],
    halfWidth: [[0,8.8],[.10,8.2],[.18,7.8],[.30,6.6],[.42,7.4],[.49,6.2],
      [.58,6.7],[.66,7.3],[.79,8.3],[.91,6.9],[.98,8.3]],
    boosts: [{t0:.205,t1:.22,lat:-2,hw:2},{t0:.531,t1:.547,lat:2,hw:2},
      {t0:.718,t1:.731,lat:0,hw:2.8},{t0:.963,t1:.978,lat:-2,hw:2}],
  },
];

export function resolveCircuit(search: string): Circuit {
  const id = new URLSearchParams(search).get('track');
  return circuits.find(course => course.id === id) ?? circuits[0];
}

export const activeCircuit = globalThis.location ? resolveCircuit(globalThis.location.search) : circuits[0];
