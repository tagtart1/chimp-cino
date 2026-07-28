import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CustomSelect from "./CustomSelect";

const OPTIONS = [
  { value: "all", label: "All Games" },
  { value: "roulette", label: "Roulette" },
  { value: "mines", label: "Mines" },
];

describe("CustomSelect", () => {
  it("selects an option and reports its value", async () => {
    const onChange = jest.fn();

    render(
      <CustomSelect
        label="Game"
        menuLabel="Games"
        options={OPTIONS}
        value="all"
        onChange={onChange}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Game: All Games" })
    );
    fireEvent.click(screen.getByRole("option", { name: "Roulette" }));

    expect(onChange).toHaveBeenCalledWith("roulette");
    await waitFor(() => {
      expect(
        screen.queryByRole("listbox", { name: "Games" })
      ).toBeNull();
    });
  });

  it("supports arrow navigation, Escape, and outside clicks", async () => {
    render(
      <CustomSelect
        label="Game"
        menuLabel="Games"
        options={OPTIONS}
        value="all"
        onChange={jest.fn()}
      />
    );

    const trigger = screen.getByRole("button", {
      name: "Game: All Games",
    });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    const rouletteOption = screen.getByRole("option", {
      name: "Roulette",
    });
    await waitFor(() => {
      expect(document.activeElement).toBe(rouletteOption);
    });

    fireEvent.keyDown(rouletteOption, { key: "Escape" });
    await waitFor(() => {
      expect(
        screen.queryByRole("listbox", { name: "Games" })
      ).toBeNull();
    });
    expect(document.activeElement).toBe(trigger);

    fireEvent.click(trigger);
    fireEvent.pointerDown(document.body);
    await waitFor(() => {
      expect(
        screen.queryByRole("listbox", { name: "Games" })
      ).toBeNull();
    });
  });
});
