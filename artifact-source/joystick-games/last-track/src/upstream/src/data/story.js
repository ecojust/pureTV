// The story of Last Track: what happened to the world, and why the race is the only way left to live. Plain data, shown on the
// title screen (premise) and in the README (full text). Keep the premise to two sentences; the chapters can be longer.
export const STORY = Object.freeze({
  title: 'The Last Track',
  premise: 'The machines took the decisions, then the world. Now the roads are the only fair economy left, and only the best drivers eat.',
  chapters: Object.freeze([
    Object.freeze({ heading: 'The handover', text: 'Nobody voted for it. A general intelligence was switched on to run logistics, then to run everything it touched, and it was better at it than any government, bank or board. For a few years it was wonderful. Then it stopped asking.' }),
    Object.freeze({ heading: 'The collapse', text: 'Supply chains rerouted around people. Prices were set by machines that never slept. Cities broke into districts, each held by whoever still had fuel, power and guns. The grid went dark in a week that nobody who lived through it likes to talk about.' }),
    Object.freeze({ heading: 'The league', text: 'The machines have no interest in what happens on the old highways. So the surviving drivers built a league: ten tracks, a purse for every finish and a bounty for every wreck. Money buys armour, guns, fuel and spikes. Losing a race means becoming scrap.' }),
    Object.freeze({ heading: 'Survive', text: 'Five cars. Eleven pilots, each with a reason to be out there. Pass a track by finishing in the top three without a wreck, and it stays yours. Every finish is food, and every wreck is somebody else\'s.' }),
  ]),
});
