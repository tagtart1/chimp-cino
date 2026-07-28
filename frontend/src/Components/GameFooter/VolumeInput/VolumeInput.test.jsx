import { fireEvent, render, screen } from "@testing-library/react";
import VolumeInput from "./VolumeInput";

describe("VolumeInput", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists smooth slider changes and restores the previous volume", () => {
    render(<VolumeInput />);

    const slider = screen.getByRole("slider", { name: "Volume" });
    fireEvent.change(slider, { target: { value: "0.78" } });
    expect(slider.value).toBe("0.78");
    expect(localStorage.getItem("audioVolume")).toBe("0.78");

    fireEvent.click(screen.getByRole("button", { name: "Mute sound" }));
    expect(slider.value).toBe("0");

    fireEvent.click(screen.getByRole("button", { name: "Unmute sound" }));
    expect(slider.value).toBe("0.78");
  });
});
