// HUD rendering moved to React (GameHUD component).
// This class is kept as a no-op so PlayScene compiles without changes.
export class HUDSystem {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_scene: unknown, _levelName: string, _totalQuestions: number, _onTheory?: () => void) {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(_lives: number, _score: number, _energy: number, _answered: number, _total: number): void {}
  punchScore(): void {}
}
