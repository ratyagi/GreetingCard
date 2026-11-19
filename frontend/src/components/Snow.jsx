import React, { useMemo } from "react";

// Soft falling snow — mostly white, a few warm red flakes, to match the
// cream / red / white festive palette.
export const Snow = ({ count = 48 }) => {
  const flakes = useMemo(() => {
    const rand = (min, max) => Math.random() * (max - min) + min;
    return Array.from({ length: count }).map((_, i) => {
      const isRed = Math.random() < 0.18;
      const size = rand(3, 8);
      return {
        id: i,
        left: rand(0, 100),
        size,
        duration: rand(7, 15),
        delay: rand(-15, 0),
        drift: `${rand(-6, 6)}vw`,
        opacity: rand(0.5, 0.95),
        color: isRed ? "#c9414f" : "#ffffff",
        glow: isRed
          ? "0 0 6px rgba(201,65,79,0.7)"
          : "0 0 5px rgba(255,255,255,0.85)",
      };
    });
  }, [count]);

  return (
    <div className="snow-layer" data-testid="snow-layer" aria-hidden="true">
      {flakes.map((f) => (
        <span
          key={f.id}
          className="flake"
          style={{
            left: `${f.left}%`,
            width: `${f.size}px`,
            height: `${f.size}px`,
            background: f.color,
            opacity: f.opacity,
            boxShadow: f.glow,
            animationDuration: `${f.duration}s`,
            animationDelay: `${f.delay}s`,
            "--drift": f.drift,
          }}
        />
      ))}
    </div>
  );
};

export default Snow;
