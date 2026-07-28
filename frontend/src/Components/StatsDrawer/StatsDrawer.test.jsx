import { act } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import StatsDrawer from "./StatsDrawer";

jest.mock("../../Contexts/UserProvider", () => ({
  useUser: () => ({ user: { id: 42, username: "stats-user" } }),
}));

const summaryResponse = {
  range: "day",
  game: "all",
  timezone: "America/Chicago",
  period: { start: "2026-07-28", end: "2026-07-28", bucket: null },
  summary: {
    gamesPlayed: 12,
    totalWagered: 125,
    totalPayout: 132,
    netResult: 7,
    maxGameNet: 20,
  },
  games: [
    {
      game: "roulette",
      gamesPlayed: 4,
      totalWagered: 40,
      totalPayout: 50,
      netResult: 10,
      maxGameNet: 15,
    },
    {
      game: "blackjack",
      gamesPlayed: 5,
      totalWagered: 60,
      totalPayout: 55,
      netResult: -5,
      maxGameNet: 10,
    },
    {
      game: "mines",
      gamesPlayed: 3,
      totalWagered: 25,
      totalPayout: 27,
      netResult: 2,
      maxGameNet: 8,
    },
  ],
  timeline: [],
};

const gameResult = (id, game, netResult) => ({
  id,
  game,
  wagered: 10,
  payout: 10 + netResult,
  netResult,
  completedAt: `2026-07-28T1${id % 10}:00:00.000Z`,
});

describe("StatsDrawer", () => {
  const observerCallbacks = [];

  beforeEach(() => {
    observerCallbacks.length = 0;
    global.IntersectionObserver = class IntersectionObserver {
      constructor(callback) {
        observerCallbacks.push(callback);
      }

      observe() {}

      disconnect() {}
    };

    const firstPage = Array.from({ length: 10 }, (_, index) =>
      gameResult(
        index + 1,
        ["roulette", "blackjack", "mines"][index % 3],
        index % 2 === 0 ? 5 : -3
      )
    );
    const secondPage = [
      gameResult(11, "roulette", 20),
      gameResult(12, "mines", -10),
    ];

    global.fetch = jest.fn(async (input) => {
      const url = String(input);

      if (url.includes("/analytics/history")) {
        const isSecondPage = url.includes("cursor=next-page");
        return {
          ok: true,
          json: async () => ({
            game: "all",
            limit: 10,
            results: isSecondPage ? secondPage : firstPage,
            nextCursor: isSecondPage ? null : "next-page",
          }),
        };
      }

      return {
        ok: true,
        json: async () => ({
          ...summaryResponse,
          range: url.includes("range=week") ? "week" : "day",
        }),
      };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("loads the summary, starts history at 10, and fetches the next cursor", async () => {
    render(
      <StatsDrawer
        isMobile={false}
        isOpen
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByText("12")).not.toBeNull();
    await waitFor(() => {
      expect(screen.getAllByRole("article")).toHaveLength(10);
    });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/analytics/history?game=all&limit=10"),
      { credentials: "include" }
    );
    await waitFor(() => {
      expect(observerCallbacks).toHaveLength(1);
    });

    await act(async () => {
      observerCallbacks[0]([{ isIntersecting: true }]);
    });
    await waitFor(() => {
      expect(screen.getAllByRole("article")).toHaveLength(12);
    });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("cursor=next-page"),
      { credentials: "include" }
    );

    fireEvent.click(screen.getByRole("button", { name: "7 days" }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/analytics?range=week&game=all"),
        expect.objectContaining({ credentials: "include" })
      );
    });
    await waitFor(() => {
      expect(
        screen
          .getByText("Games played")
          .closest(".stats-summary-grid")
          .getAttribute("aria-busy")
      ).toBe("false");
    });

    fireEvent.change(screen.getByRole("combobox", { name: "Game" }), {
      target: { value: "roulette" },
    });
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/analytics?range=week&game=roulette"),
        expect.objectContaining({ credentials: "include" })
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "/analytics/history?game=roulette&limit=10"
        ),
        { credentials: "include" }
      );
    });
    await waitFor(() => {
      expect(screen.getAllByRole("article")).toHaveLength(10);
      expect(
        screen
          .getByText("Games played")
          .closest(".stats-summary-grid")
          .getAttribute("aria-busy")
      ).toBe("false");
    });
  });
});
