export const NAVAL_SIZE = 8;
export const FLEET = [4, 3, 3, 2, 2];
export function randomFleet(random = Math.random) {
  const board = Array(64).fill(0);
  FLEET.forEach((length, id) => {
    let placed = false;
    for (let attempt = 0; attempt < 10000 && !placed; attempt++) {
      const row = Math.floor(random() * 8),
        col = Math.floor(random() * 8),
        vertical = random() < 0.5;
      const cells = Array.from(
        { length },
        (_, i) => (row + (vertical ? i : 0)) * 8 + col + (vertical ? 0 : i),
      );
      if (
        (vertical ? row + length : col + length) > 8 ||
        cells.some((i) => board[i])
      )
        continue;
      cells.forEach((i) => (board[i] = id + 1));
      placed = true;
    }
    if (!placed) throw new Error("Cannot place fleet");
  });
  return board;
}
export function newNaval(seats, random = Math.random) {
  return {
    seats,
    boards: seats.map(() => randomFleet(random)),
    shots: seats.map(() => Array(64).fill(null)),
    turn: 0,
    winner: null,
  };
}
export function fireNaval(s, seat, cell) {
  if (
    s.winner !== null ||
    s.turn !== seat ||
    !Number.isInteger(cell) ||
    cell < 0 ||
    cell >= 64 ||
    s.shots[seat][cell] !== null
  )
    return null;
  const enemy = 1 - seat,
    hit = s.boards[enemy][cell] > 0;
  const shots = s.shots.map((a, i) =>
    i === seat ? a.map((v, k) => (k === cell ? hit : v)) : a,
  );
  const won = s.boards[enemy].every((v, i) => !v || shots[seat][i] === true);
  return { ...s, shots, turn: enemy, winner: won ? seat : null };
}
export function navalView(s, seat) {
  const enemy = 1 - seat;
  const sunk =
    seat >= 0
      ? FLEET.map((_, id) =>
          s.boards[enemy]
            .map((v, i) => (v === id + 1 ? i : null))
            .filter((i) => i !== null),
        ).filter((cells) => cells.every((i) => s.shots[seat][i] === true))
      : [];
  return {
    turn: s.turn,
    winner: s.winner,
    mySeat: seat,
    board: seat >= 0 ? s.boards[seat] : [],
    shots: seat >= 0 ? s.shots[seat] : [],
    incoming: seat >= 0 ? s.shots[enemy] : [],
    sunk,
  };
}
