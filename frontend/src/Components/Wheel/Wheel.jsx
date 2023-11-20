import React, { useEffect, useRef, useState } from "react";
import "./Wheel.scss";

const Wheel = ({ numberOfWedges, winningNum }) => {
  const [ballYValue, setBallYValue] = useState(1.08);
  const viewBoxSize = 325;
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

  // Generate unique colors for the wedges
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
      const duration = 3500; // 3.5 seconds

      const step = (timestamp) => {
        if (!start) start = timestamp;
        const progress = timestamp - start;

        let newValue;
        if (progress < 2000) {
          // Phase 1: Stay at 1.08 for 2 seconds
          newValue = startValue;
        } else if (progress < 2200) {
          // Phase 2: Drop to 0.72 in 0.2 seconds
          const phaseProgress = (progress - 2000) / 200;
          newValue = startValue - (startValue - endValue) * phaseProgress;
        } else if (progress < 2400) {
          // Phase 3: Jump to 0.97 in 0.2 seconds
          const phaseProgress = (progress - 2200) / 200;
          newValue = endValue + (0.85 - endValue) * phaseProgress;
        } else if (progress < 2600) {
          // Phase 4: Drop back to 0.72 in 0.2 seconds
          const phaseProgress = (progress - 2400) / 200;
          newValue = 0.85 - (0.85 - endValue) * phaseProgress;
        } else if (progress < 2800) {
          // Phase 5: Jump to 0.85 in 0.2 seconds
          const phaseProgress = (progress - 2600) / 200;
          newValue = endValue + (0.85 - endValue) * phaseProgress;
        } else if (progress < 3000) {
          // Final Phase: Go to 0.72 in 0.2 seconds
          const phaseProgress = (progress - 2800) / 200;
          newValue = 0.85 - (0.85 - endValue) * phaseProgress;
        } else {
          newValue = endValue; // Ensure it ends at 0.72
        }

        setBallYValue(newValue);

        if (progress < duration) {
          requestAnimationFrame(step);
        }
      };

      requestAnimationFrame(step);
    };
    console.log(winningNum);
    ballRef.current.classList.remove("roulette-visible");
    startAnimation();
  }, [winningNum]);

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
          r={viewBoxSize * 0.49}
          fill="#041A22"
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
          cx={winningMarkerPosition.x}
          cy={winningMarkerPosition.y}
          r={6} // Radius of the winning marker
          fill="white"
          ref={ballRef}
          style={{
            visibility: "hidden",
          }}
          onAnimationEnd={(e) => {
            e.currentTarget.classList.remove("roulette-ball");
          }}
        />
      </svg>
    </div>
  );
};

export default Wheel;
