import {
  act,
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import DailyBonusModal from "./DailyBonusModal";
import {
  createDailyBonusReel,
  REEL_LENGTH,
  WINNER_INDEX,
} from "./dailyBonusReel";

let mockUser;
let mockPrefersReducedMotion;
let mockResolveAnimation;
const mockSetUser = jest.fn();
const mockAnimationStart = jest.fn();
const mockAnimationSet = jest.fn();
const mockAnimationStop = jest.fn();
const mockPlayAudio = jest.fn();

jest.mock("../../Contexts/UserProvider", () => ({
  useUser: () => ({ user: mockUser, setUser: mockSetUser }),
}));

jest.mock("../../Helpers/sfxPlayer", () => ({
  __esModule: true,
  default: { playAudio: (...args) => mockPlayAudio(...args) },
}));

jest.mock("framer-motion", () => ({
  ...(() => {
    const React = jest.requireActual("react");
    const motionComponent = (tag) =>
      React.forwardRef(function MockMotionComponent(
        {
          animate,
          children,
          exit,
          initial,
          layout,
          transition,
          ...props
        },
        ref
      ) {
        return React.createElement(tag, { ...props, ref }, children);
      });

    return {
      AnimatePresence: ({ children }) => children,
      motion: {
        div: motionComponent("div"),
        section: motionComponent("section"),
      },
      useReducedMotion: () => mockPrefersReducedMotion,
      useAnimationControls: () => ({
        start: mockAnimationStart,
        set: mockAnimationSet,
        stop: mockAnimationStop,
      }),
    };
  })(),
}));

const claimResult = {
  rarity: "PINK",
  payout: 2_100,
  dailyBonusStreak: 3,
  lastDailyBonusClaimedOn: "2026-07-28T00:00:00.000Z",
  balance: 12_100,
};

const mockSuccessfulClaim = () => {
  global.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ data: claimResult }),
  });
};

describe("DailyBonusModal", () => {
  beforeEach(() => {
    mockUser = {
      id: 7,
      balance: 10_000,
      dailyBonusStreak: 2,
      lastDailyBonusClaimedOn: "2026-07-27T00:00:00.000Z",
    };
    mockPrefersReducedMotion = true;
    mockResolveAnimation = null;
    mockSetUser.mockReset();
    mockPlayAudio.mockReset();
    mockAnimationStart.mockReset();
    mockAnimationSet.mockReset();
    mockAnimationStop.mockReset();
    mockAnimationStart.mockResolvedValue();
    global.fetch = jest.fn();
    window.scrollTo = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("reveals the server-selected gem and updates wallet state", async () => {
    mockSuccessfulClaim();

    render(<DailyBonusModal isOpen onClose={jest.fn()} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Claim Daily Bonus" })
    );

    expect(
      await screen.findByRole("status", { name: "2,100 gold" })
    ).toBeInTheDocument();
    const revealedGem = screen.getByRole("img", {
      name: "pink rarity gem",
    });
    expect(
      within(screen.getByTestId("daily-bonus-winning-slot")).getByRole(
        "img",
        { name: "pink rarity gem" }
      )
    ).toBe(revealedGem);
    expect(
      screen.getAllByTestId("daily-bonus-gem-slot")
    ).toHaveLength(REEL_LENGTH - 1);
    expect(
      screen.getAllByTestId(/daily-bonus-(?:gem|winning)-slot/)
    ).toHaveLength(REEL_LENGTH);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/users/daily-bonus/claim"),
      { method: "POST", credentials: "include" }
    );
    await waitFor(() => expect(mockSetUser).toHaveBeenCalledTimes(1));

    const updateUser = mockSetUser.mock.calls[0][0];
    expect(updateUser(mockUser)).toEqual({
      ...mockUser,
      balance: 12_100,
      dailyBonusStreak: 3,
      lastDailyBonusClaimedOn: "2026-07-28T00:00:00.000Z",
    });
    expect(mockPlayAudio).toHaveBeenCalledWith("gem");
  });

  it("only places gold in the reel when gold is the server winner", () => {
    const reel = createDailyBonusReel("GOLD", () => 0.999);

    expect(reel).toHaveLength(REEL_LENGTH);
    expect(reel[WINNER_INDEX]).toMatchObject({
      rarity: "GOLD",
      isWinner: true,
    });
    expect(reel.filter(({ rarity }) => rarity === "GOLD")).toHaveLength(
      1
    );
    expect(reel.filter(({ isWinner }) => isWinner)).toHaveLength(1);
  });

  it("never generates blue or cosmetic gold slots", () => {
    for (const randomRoll of [0, 0.9, 0.98, 0.999]) {
      const reel = createDailyBonusReel("GREEN", () => randomRoll);
      const cosmeticRarities = reel
        .filter(({ isWinner }) => !isWinner)
        .map(({ rarity }) => rarity);

      expect(cosmeticRarities).not.toContain("BLUE");
      expect(cosmeticRarities).not.toContain("GOLD");
    }
  });

  it("waits for desktop expansion and targets the marker's actual position", async () => {
    mockPrefersReducedMotion = false;
    mockSuccessfulClaim();
    jest
      .spyOn(document.documentElement, "clientWidth", "get")
      .mockReturnValue(1024);
    jest
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function getBoundingClientRect() {
        if (this.classList.contains("daily-bonus-case-marker")) {
          return { left: 398, width: 4 };
        }
        if (this.dataset.winner === "true") {
          return { left: 120, width: 80 };
        }
        return { left: 0, width: 0 };
      });

    render(<DailyBonusModal isOpen onClose={jest.fn()} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Claim Daily Bonus" })
    );

    const dialog = await screen.findByRole("dialog", {
      name: "Daily Reward",
    });
    expect(mockAnimationStart).not.toHaveBeenCalled();

    fireEvent.transitionEnd(dialog, { propertyName: "width" });

    await waitFor(() =>
      expect(mockAnimationStart).toHaveBeenCalledWith(
        expect.objectContaining({ x: 240 })
      )
    );
  });

  it("defers the wallet update until the reel finishes", async () => {
    mockPrefersReducedMotion = false;
    mockAnimationStart.mockImplementation(
      () =>
        new Promise((resolve) => {
          mockResolveAnimation = resolve;
        })
    );
    mockSuccessfulClaim();

    render(<DailyBonusModal isOpen onClose={jest.fn()} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Claim Daily Bonus" })
    );

    await waitFor(() => expect(mockAnimationStart).toHaveBeenCalledTimes(1));
    expect(
      screen.getByRole("dialog", { name: "Daily Reward" })
    ).toHaveClass("has-case-opening");
    expect(screen.queryByText("Finding your gem…")).not.toBeInTheDocument();
    expect(mockSetUser).not.toHaveBeenCalled();

    await act(async () => {
      mockResolveAnimation();
    });

    await waitFor(() => expect(mockSetUser).toHaveBeenCalledTimes(1));
    expect(
      screen.getByRole("dialog", { name: "Daily Reward" })
    ).not.toHaveClass("has-case-opening");
    expect(
      screen.getByRole("status", { name: "2,100 gold" })
    ).toBeInTheDocument();
  });

  it("applies the wallet result when closed during the spin", async () => {
    mockPrefersReducedMotion = false;
    mockAnimationStart.mockImplementation(
      () =>
        new Promise((resolve) => {
          mockResolveAnimation = resolve;
        })
    );
    mockSuccessfulClaim();
    const onClose = jest.fn();

    render(<DailyBonusModal isOpen onClose={onClose} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Claim Daily Bonus" })
    );
    await waitFor(() => expect(mockAnimationStart).toHaveBeenCalledTimes(1));
    expect(screen.queryByText("Finding your gem…")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Close daily bonus dialog" })
    );

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockSetUser).toHaveBeenCalledTimes(1);
  });

  it("disables opening when today's bonus was already collected", () => {
    mockUser = {
      ...mockUser,
      lastDailyBonusClaimedOn: new Date().toISOString(),
    };

    render(<DailyBonusModal isOpen onClose={jest.fn()} />);

    expect(screen.getByText("Next claim in")).toBeInTheDocument();
    expect(screen.getByRole("timer")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Claim Daily Bonus" })
    ).toBeDisabled();
    expect(
      screen.getByTestId("daily-bonus-streak-summary")
    ).toHaveClass("is-lit");
  });

  it("shows claim failures without starting the reel", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Daily bonus already claimed" }),
    });

    render(<DailyBonusModal isOpen onClose={jest.fn()} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Claim Daily Bonus" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Daily bonus already claimed"
    );
    expect(mockAnimationStart).not.toHaveBeenCalled();
    expect(mockSetUser).not.toHaveBeenCalled();
  });

  it("resets the claim date and streak for testing", async () => {
    mockUser = {
      ...mockUser,
      lastDailyBonusClaimedOn: new Date().toISOString(),
    };
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          dailyBonusStreak: 0,
          lastDailyBonusClaimedOn: null,
        },
      }),
    });

    render(<DailyBonusModal isOpen onClose={jest.fn()} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Reset for testing" })
    );

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/users/daily-bonus/reset-for-testing"),
        { method: "POST", credentials: "include" }
      )
    );
    await waitFor(() => expect(mockSetUser).toHaveBeenCalledTimes(1));

    const updateUser = mockSetUser.mock.calls[0][0];
    expect(updateUser(mockUser)).toEqual({
      ...mockUser,
      dailyBonusStreak: 0,
      lastDailyBonusClaimedOn: null,
    });
  });

  it("closes on Escape", async () => {
    const onClose = jest.fn();
    render(<DailyBonusModal isOpen onClose={onClose} />);

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });
});
