import { fireEvent, render, screen } from "@testing-library/react";
import CustomSlider from "./CustomSlider";

describe("CustomSlider", () => {
  it("reports numeric changes and renders configurable breakpoints", () => {
    const onChange = jest.fn();

    const { container } = render(
      <CustomSlider
        ariaLabel="Volume"
        min={0}
        max={1}
        step={0.01}
        value={0.5}
        onChange={onChange}
        options={{
          colors: [
            { value: 0, color: "#ffc800" },
            { value: 1, color: "#00e701" },
          ],
          breakpoints: [0.25, 0.5, 0.75],
          trackHeight: 28,
          thumbSize: 32,
        }}
        formatValue={(value) => `${Math.round(value * 100)}%`}
      />
    );

    const slider = screen.getByRole("slider", { name: "Volume" });
    expect(slider.getAttribute("aria-valuetext")).toBe("50%");
    expect(
      container.querySelectorAll(".custom-slider__breakpoints > span")
    ).toHaveLength(3);
    expect(
      container
        .querySelector(".custom-slider")
        .style.getPropertyValue("--custom-slider-progress")
    ).toBe("50%");

    fireEvent.change(slider, { target: { value: "0.72" } });
    expect(onChange).toHaveBeenCalledWith(0.72);
  });
});
