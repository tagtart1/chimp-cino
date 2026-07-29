import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import soundManager from "../../../Helpers/sfxPlayer";
import MinesCell from "./MinesCell";

jest.mock("../../../Helpers/sfxPlayer", () => ({
  __esModule: true,
  default: { playAudio: jest.fn() },
}));

const baseProps = {
  gameInProgress: true,
  field: 0,
  value: 0,
  resetCells: false,
  updateGame: jest.fn(),
  endGame: jest.fn(),
  gameIsEnding: false,
  setActionsCount: jest.fn(),
  scheduleFetch: jest.fn(),
};

const revealFirstTileMine = () => {
  const view = render(<MinesCell {...baseProps} />);
  fireEvent.click(screen.getByRole("button"));
  view.rerender(
    <MinesCell {...baseProps} value={2} gameIsEnding />
  );
  return view;
};

describe("MinesCell explosion", () => {
  beforeEach(() => {
    soundManager.playAudio.mockClear();
    baseProps.scheduleFetch.mockClear();
    baseProps.setActionsCount.mockClear();
  });

  it("starts a fresh explosion immediately for a first-tile mine", () => {
    revealFirstTileMine();

    const explosion = screen.getByRole("img", {
      name: "mine explosion effect",
    });
    expect(explosion).toHaveAttribute(
      "src",
      expect.stringMatching(/[?&]run=\d+$/)
    );
    expect(soundManager.playAudio).toHaveBeenCalledWith("bomb");
  });

  it("uses a unique GIF URL for each explosion", () => {
    const firstView = revealFirstTileMine();
    const firstUrl = screen
      .getByRole("img", { name: "mine explosion effect" })
      .getAttribute("src");
    firstView.unmount();

    revealFirstTileMine();
    const secondUrl = screen
      .getByRole("img", { name: "mine explosion effect" })
      .getAttribute("src");

    expect(secondUrl).not.toBe(firstUrl);
  });
});
