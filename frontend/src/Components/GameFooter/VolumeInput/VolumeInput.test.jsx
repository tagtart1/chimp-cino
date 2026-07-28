import { fireEvent, render, screen } from "@testing-library/react";
import VolumeInput from "./VolumeInput";

describe("VolumeInput", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists snapped slider changes without a separate mute button", () => {
    const { container } = render(<VolumeInput />);

    const slider = screen.getByRole("slider", { name: "Volume" });
    expect(screen.queryByRole("button")).toBeNull();
    expect(
      container.querySelector(".custom-slider__thumb svg")
    ).not.toBeNull();
    expect(
      container.querySelector(".volume-slider__speaker-icon--muted")
    ).toBeNull();

    fireEvent.change(slider, { target: { value: "0.78" } });
    expect(slider.value).toBe("0.8");
    expect(localStorage.getItem("audioVolume")).toBe("0.8");

    fireEvent.change(slider, { target: { value: "0" } });
    expect(slider.value).toBe("0");
    expect(localStorage.getItem("audioVolume")).toBe("0");
    expect(
      container.querySelector(".volume-slider__speaker-icon--muted")
    ).not.toBeNull();
  });

  it("normalizes previously stored values to the nearest breakpoint", () => {
    localStorage.setItem("audioVolume", "0.51");

    render(<VolumeInput />);

    expect(screen.getByRole("slider", { name: "Volume" }).value).toBe(
      "0.6"
    );
  });
});
