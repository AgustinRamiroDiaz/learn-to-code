export const starterCode = `function solve() {
  moveRight();
  moveRight();
  jump();
  collectCoin();
}
`;

export const gameApiTypes = `declare function moveRight(): void;
declare function jump(): void;
declare function collectCoin(): void;
declare function log(message: string): void;
`;

export const levelBrief = {
  objective: "Move to x=2, jump, and collect the coin.",
  success: "Coin collected at x=2 while jumping.",
  hint: "Try calling moveRight(), moveRight(), jump(), then collectCoin().",
};
