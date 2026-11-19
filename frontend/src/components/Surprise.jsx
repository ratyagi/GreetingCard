import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ---- The hidden surprise (editable) ---- */
const NOTE = "P.S. You found the hidden present. Merry Christmas, Goollak. ♥";

const COLORS = ["#b22231", "#c9a24b", "#f6dc8a", "#ffffff", "#e7d6b4", "#c9414f"];

// A tiny gift tucked in the bottom-left corner. Click it: the lid pops, confetti flies and a
// little note appears.
export default function Surprise({ show }) {
  const [lidUp, setLidUp] = useState(false);
  const [burst, setBurst] = useState(0); // changes on every click, restarting the confetti
  const [confettiOn, setConfettiOn] = useState(false);
  const [noteOn, setNoteOn] = useState(false);
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const pieces = useMemo(() => {
    const rand = (a, b) => Math.random() * (b - a) + a;
    return Array.from({ length: 44 }).map((_, i) => ({
      id: i,
      dx: rand(-170, 260),
      up: rand(110, 260),
      fall: rand(60, 220),
      rot: rand(-540, 540),
      w: rand(5, 9),
      h: rand(8, 14),
      dur: rand(1.7, 2.6),
      color: COLORS[i % COLORS.length],
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [burst]);

  const open = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setBurst((b) => b + 1);
    setConfettiOn(true);
    setLidUp(true);
    setNoteOn(true);
    timers.current.push(setTimeout(() => setLidUp(false), 1100));
    timers.current.push(setTimeout(() => setConfettiOn(false), 3000));
    timers.current.push(setTimeout(() => setNoteOn(false), 8000));
  };

  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-[45]" data-testid="surprise">
      {/* confetti, shot out of the gift */}
      {confettiOn &&
        pieces.map((p) => (
          <motion.span
            key={`${burst}-${p.id}`}
            className="absolute block"
            style={{
              left: 20,
              bottom: 24,
              width: p.w,
              height: p.h,
              background: p.color,
              borderRadius: 1.5,
            }}
            initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
            animate={{
              x: [0, p.dx * 0.6, p.dx],
              y: [0, -p.up, p.fall],
              rotate: p.rot,
              opacity: [1, 1, 0],
            }}
            transition={{ duration: p.dur, times: [0, 0.4, 1], ease: "easeOut" }}
          />
        ))}

      {/* the note */}
      <AnimatePresence>
        {noteOn && (
          <motion.button
            type="button"
            onClick={() => setNoteOn(false)}
            className="pointer-events-auto absolute bottom-[58px] left-0 w-[250px] rounded-md px-4 py-3 text-left font-type text-[12.5px] leading-relaxed"
            style={{
              background: "#fbf6ea",
              color: "var(--ink)",
              border: "1px solid rgba(201,162,75,0.55)",
              boxShadow: "0 14px 28px -14px rgba(43,42,38,0.5)",
              outline: "none",
            }}
            initial={{ opacity: 0, y: 14, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: -1.2 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            aria-label="Close the note"
          >
            {NOTE}
          </motion.button>
        )}
      </AnimatePresence>

      {/* the gift */}
      <motion.button
        type="button"
        onClick={open}
        aria-label="A small hidden gift. Open it."
        data-testid="surprise-gift"
        className="pointer-events-auto block"
        style={{ outline: "none", cursor: "pointer", background: "none", border: 0, padding: 0 }}
        initial={false}
        animate={{ opacity: show ? 0.9 : 0, y: show ? 0 : 12 }}
        whileHover={show ? { scale: 1.12, rotate: -4 } : {}}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        tabIndex={show ? 0 : -1}
      >
        <svg width="40" height="44" viewBox="0 0 40 44" aria-hidden="true">
          {/* box */}
          <rect x="4" y="19" width="32" height="22" rx="2" fill="#b22231" />
          <rect x="4" y="19" width="32" height="22" rx="2" fill="rgba(0,0,0,0.12)" />
          <rect x="17.5" y="19" width="5" height="22" fill="#c9a24b" />
          {/* lid + bow, lifts when opened */}
          <motion.g
            initial={false}
            animate={lidUp ? { y: -10, rotate: -16 } : { y: 0, rotate: 0 }}
            style={{ originX: "4px", originY: "19px" }}
            transition={{ type: "spring", stiffness: 380, damping: 16 }}
          >
            <rect x="2" y="12" width="36" height="9" rx="2" fill="#c4303d" />
            <rect x="17.5" y="12" width="5" height="9" fill="#d8b45c" />
            <path d="M20 12 C12 2 5 6 11 11 C14 13 18 12 20 12 Z" fill="#d8b45c" />
            <path d="M20 12 C28 2 35 6 29 11 C26 13 22 12 20 12 Z" fill="#c9a24b" />
            <circle cx="20" cy="12" r="2.4" fill="#e6c877" />
          </motion.g>
        </svg>
      </motion.button>
    </div>
  );
}
