import React, { useEffect, useRef, useState } from "react";
import "./Wheel.scss";

const Wheel = ({
  numberOfWedges,
  winningNum,
  onGameEnd,
  spinDuration = 3500,
}) => {
  const [ballYValue, setBallYValue] = useState(1.08);
  const viewBoxSize = 280;
  const radius = (viewBoxSize * 0.85) / 2;

  const ballRef = useRef();
  const wedges = [];
  const numbers = [];
  const numOrder = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
    24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
  ];
  const wedgeAngle = 360 / numberOfWedges;

  // Function to calculate text position
  const getTextPosition = (index) => {
    const angle = (wedgeAngle * index + wedgeAngle / 2) * (Math.PI / 180); // Angle in radians
    return {
      x: viewBoxSize / 2 + radius * 0.92 * Math.sin(angle), // 0.85 to position text inside the wedge edge
      y: viewBoxSize / 2 - radius * 0.92 * Math.cos(angle),
    };
  };

  // Function to calculate the position of the winning marker
  const getMarkerPosition = (winningNum) => {
    const angle = (wedgeAngle * winningNum + wedgeAngle / 2) * (Math.PI / 180); // Angle in radians
    return {
      x: viewBoxSize / 2 + radius * ballYValue * Math.sin(angle), // 0.85 to position text inside the wedge edge
      y: viewBoxSize / 2 - radius * ballYValue * Math.cos(angle),
    };
  };

  // Generate colors for the wedges
  const getWedgeColor = (index) => {
    if (index === 0) return "#419e3f"; // Green for the '0' wedge
    return index % 2 === 0 ? "#2f4553" : "#fe2247"; // Alternating black and red for others
  };

  for (let i = 0; i < numberOfWedges; i++) {
    const startAngle = (wedgeAngle * i * Math.PI) / 180;
    const endAngle = (wedgeAngle * (i + 1) * Math.PI) / 180;

    // Calculate start and end points on the circle edge for the wedge
    const x1 = viewBoxSize / 2 + radius * Math.sin(startAngle);
    const y1 = viewBoxSize / 2 - radius * Math.cos(startAngle);
    const x2 = viewBoxSize / 2 + radius * Math.sin(endAngle);
    const y2 = viewBoxSize / 2 - radius * Math.cos(endAngle);

    // Define the wedge path
    const path = `M ${viewBoxSize / 2},${
      viewBoxSize / 2
    } L ${x1},${y1} A ${radius},${radius} 0 0,1 ${x2},${y2} z`;

    wedges.push(<path key={i} d={path} fill={getWedgeColor(i)} />);

    const textPosition = getTextPosition(i);
    numbers.push(
      <text
        key={i}
        x={textPosition.x}
        y={textPosition.y}
        fill="white"
        fontSize={viewBoxSize * 0.035} // Adjust font size based on wheel size
        fontWeight={700}
        textAnchor="middle"
        alignmentBaseline="middle"
        transform={`rotate(${wedgeAngle * i + wedgeAngle / 2}, ${
          textPosition.x
        }, ${textPosition.y})`}
      >
        {numOrder[i]}
      </text>
    );
  }

  const winningIndex = numOrder.findIndex((num) => num === winningNum);

  const winningMarkerPosition = getMarkerPosition(winningIndex);

  useEffect(() => {
    const startAnimation = () => {
      if (winningNum === null) return;
      console.log("anim");
      ballRef.current.classList.add("roulette-visible");
      ballRef.current.classList.add("roulette-ball");
      let start = null;
      const startValue = 1.08;
      const endValue = 0.72;
      const durationScale = spinDuration / 3500;
      const scaledTime = (milliseconds) => milliseconds * durationScale;

      const step = (timestamp) => {
        if (!start) start = timestamp;
        const progress = timestamp - start;

        let newValue;
        if (progress < scaledTime(2000)) {
          // Stay on the outer track
          newValue = startValue;
        } else if (progress < scaledTime(2200)) {
          // Drop inward
          const phaseProgress =
            (progress - scaledTime(2000)) / scaledTime(200);
          newValue = startValue - (startValue - endValue) * phaseProgress;
        } else if (progress < scaledTime(2400)) {
          // First bounce
          const phaseProgress =
            (progress - scaledTime(2200)) / scaledTime(200);
          newValue = endValue + (0.85 - endValue) * phaseProgress;
        } else if (progress < scaledTime(2600)) {
          // Settle inward
          const phaseProgress =
            (progress - scaledTime(2400)) / scaledTime(200);
          newValue = 0.85 - (0.85 - endValue) * phaseProgress;
        } else if (progress < scaledTime(2800)) {
          // Second bounce
          const phaseProgress =
            (progress - scaledTime(2600)) / scaledTime(200);
          newValue = endValue + (0.85 - endValue) * phaseProgress;
        } else if (progress < scaledTime(3000)) {
          // Final settle
          const phaseProgress =
            (progress - scaledTime(2800)) / scaledTime(200);
          newValue = 0.85 - (0.85 - endValue) * phaseProgress;
        } else {
          newValue = endValue; // Ensure it ends at 0.72
        }

        setBallYValue(newValue);

        if (progress < spinDuration) {
          requestAnimationFrame(step);
        }
      };

      requestAnimationFrame(step);
    };
    console.log(winningNum);
    ballRef.current.classList.remove("roulette-visible");
    startAnimation();
  }, [winningNum, spinDuration]);

  return (
    <div>
      <svg
        width={viewBoxSize}
        height={viewBoxSize}
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        className="spinning"
        style={{
          position: "relative",
          pointerEvents: "none",
        }}
      >
        <circle
          cx={viewBoxSize / 2}
          cy={viewBoxSize / 2}
          r={viewBoxSize * 0.47}
          fill="#041A22"
          stroke="#c68f18"
          strokeWidth={viewBoxSize * 0.045}
        />
        <circle
          cx={viewBoxSize / 2}
          cy={viewBoxSize / 2}
          r={viewBoxSize * 0.445}
          fill="none"
          stroke="rgba(255, 225, 145, 0.55)"
          strokeWidth={viewBoxSize * 0.008}
        />
        {wedges}
        {numbers}
        <circle
          cx={viewBoxSize / 2}
          cy={viewBoxSize / 2}
          r={viewBoxSize * 0.35}
          fill="rgba(0, 0, 0, 0.3)"
        />
        <circle
          cx={viewBoxSize / 2}
          cy={viewBoxSize / 2}
          r={viewBoxSize * 0.28}
          fill="#041A22"
        />
        <circle
          cx={viewBoxSize / 2}
          cy={viewBoxSize / 2}
          r={viewBoxSize * 0.155}
          fill="#10232e"
          stroke="#c68f18"
          strokeWidth={viewBoxSize * 0.025}
        />
        <circle
          cx={viewBoxSize / 2}
          cy={viewBoxSize / 2}
          r={viewBoxSize * 0.082}
          fill="#213743"
          stroke="#f3d17c"
          strokeWidth={viewBoxSize * 0.012}
        />
        <circle
          cx={viewBoxSize / 2}
          cy={viewBoxSize / 2}
          r={viewBoxSize * 0.022}
          fill="#c68f18"
        />

        <circle
          cx={winningMarkerPosition.x}
          cy={winningMarkerPosition.y}
          r={6} // Radius of the winning marker
          fill="white"
          ref={ballRef}
          style={{
            visibility: "hidden",
            "--roulette-spin-duration": `${spinDuration}ms`,
          }}
          onAnimationEnd={(e) => {
            e.currentTarget.classList.remove("roulette-ball");
            onGameEnd();
          }}
        />
      </svg>
    </div>
  );
};

export default Wheel;
