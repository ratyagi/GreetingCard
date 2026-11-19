import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { Snowflake, RotateCcw, ChevronUp } from "lucide-react";
import Snow from "@/components/Snow";
import Music from "@/components/Music";
import Surprise from "@/components/Surprise";
import stampImg from "@/assets/typewriter_art.png";
import coupleImg from "@/assets/couple_art.jpg";

/* ---- The message (editable) ---- */
const GREETING = "Dear Dr. Tyagi,";
const BODY =
  "Merriest Christmas to my Goollak. I hope your light grows stronger and brighter this year. Oh and one more thing \u2014 fuck you <3";
const SIGNOFF = "with love, the smarter Tyagi sister";
const FULL_TEXT = `${GREETING}\n\n${BODY}\n\n${SIGNOFF}`;

const EASE = [0.22, 1, 0.36, 1];
const OPEN_DEG = -172; // flap rotation when the card is fully open
const DRAG_PX = 260; // how far you drag up to open the card all the way

const ENV_BG = "linear-gradient(160deg, #efe2c6 0%, #e7d6b4 100%)";
const ENV_BORDER = "1px solid rgba(125,96,52,0.3)";
const ENV_EXIT = { duration: 0.9, ease: EASE };

export default function ChristmasCard() {
  // Sequence: sealed -> flap opens -> card slides up out of the envelope ->
  // card moves forward and settles in the centre (envelope sinks away) -> drag up to open
  const [step, setStep] = useState("sealed"); // 'sealed' | 'card' (interactive)
  const [flapOpen, setFlapOpen] = useState(false);
  const [flapBehind, setFlapBehind] = useState(false);
  const [cardOut, setCardOut] = useState(false);
  const [settled, setSettled] = useState(false);
  const [cardFlat, setCardFlat] = useState(false);
  const [typed, setTyped] = useState(0);
  const [run, setRun] = useState(0);
  const timers = useRef([]);
  const typeTimer = useRef(null);

  // The flap angle is driven live by the drag; spare room above the card follows it
  const flapRot = useMotionValue(0);
  const lift = useTransform(flapRot, [0, OPEN_DEG], [0, 300]);
  const reserve = useMotionValue(0); // room for the envelope flap while it is open
  // Normal size by default. It only shrinks when the window is too short for the open card
  // (flap + card) or too narrow, so nothing runs into the page title or off screen.
  const availMV = useMotionValue(700); // window height minus the title area
  const widthFit = useMotionValue(1);
  const scaleMV = useTransform([reserve, lift, availMV, widthFit], ([r, l, av, w]) =>
    Math.max(0.5, Math.min(1, w, (av - 128) / (Math.max(r, l) + 312))),
  );
  const marginTop = useTransform([reserve, lift, scaleMV], ([r, l, sc]) => Math.max(r, l) * sc);
  const boxW = useTransform(scaleMV, (sc) => 480 * sc);
  const boxH = useTransform(scaleMV, (sc) => 312 * sc);
  const [pad, setPad] = useState(150); // room kept for the page title
  const drag = useRef({ active: false, startY: 0, startRot: 0, moved: false });

  useEffect(() => {
    const calc = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const p = vw >= 640 ? 150 : 112;
      setPad(p);
      availMV.set(vh - p - 16);
      widthFit.set(Math.min(1, (vw - 40) / 480));
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [availMV, widthFit]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

  const openEnvelope = useCallback(() => {
    if (step !== "sealed" || flapOpen) return;
    setFlapOpen(true); // flap lifts quickly
    animate(reserve, 190, { duration: 0.6, ease: EASE });
    later(() => setFlapBehind(true), 260); // flap passes vertical: tuck it behind the card
    later(() => setCardOut(true), 420); // card slides up out of the envelope
    later(() => {
      setSettled(true); // card moves forward to the centre, envelope sinks away
      animate(reserve, 0, { duration: 1.1, ease: EASE });
    }, 1650);
    later(() => setStep("card"), 2250);
  }, [step, flapOpen, reserve]);

  const toggleCard = useCallback(() => {
    if (step !== "card") return;
    setCardFlat((v) => !v);
  }, [step]);

  /* press, drag up, release to open (drag down to close) */
  const onDragStart = (e) => {
    if (step !== "card") return;
    drag.current = { active: true, startY: e.clientY, startRot: flapRot.get(), moved: false };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onDragMove = (e) => {
    const d = drag.current;
    if (!d.active) return;
    const dy = d.startY - e.clientY; // up is positive
    if (Math.abs(dy) > 6) d.moved = true;
    const rot = d.startRot - (dy / DRAG_PX) * Math.abs(OPEN_DEG);
    flapRot.set(Math.min(0, Math.max(OPEN_DEG, rot)));
  };
  const onDragEnd = () => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    if (!d.moved) return; // a plain click does nothing
    const open = flapRot.get() < OPEN_DEG * 0.4;
    animate(flapRot, open ? OPEN_DEG : 0, { duration: 0.6, ease: EASE });
    setCardFlat(open);
  };

  /* keep the flap in step when the state changes any other way (replay, keyboard) */
  useEffect(() => {
    animate(flapRot, cardFlat ? OPEN_DEG : 0, { duration: 1.1, ease: EASE });
  }, [cardFlat, flapRot]);

  const replay = useCallback(() => {
    clearTimers();
    clearInterval(typeTimer.current);
    flapRot.set(0);
    reserve.set(0);
    setCardFlat(false);
    setCardOut(false);
    setSettled(false);
    setFlapBehind(false);
    setFlapOpen(false);
    setTyped(0);
    setStep("sealed");
    setRun((r) => r + 1);
  }, [flapRot, reserve]);

  /* typewriter typing, only once the card is opened flat */
  useEffect(() => {
    clearInterval(typeTimer.current);
    if (!cardFlat) {
      setTyped(0);
      return;
    }
    const start = setTimeout(() => {
      typeTimer.current = setInterval(() => {
        setTyped((n) => {
          if (n >= FULL_TEXT.length) {
            clearInterval(typeTimer.current);
            return n;
          }
          return n + 1;
        });
      }, 42);
    }, 850);
    return () => {
      clearTimeout(start);
      clearInterval(typeTimer.current);
    };
  }, [cardFlat]);

  useEffect(() => () => clearTimers(), []);

  const done = cardFlat && typed >= FULL_TEXT.length;
  const visibleText = FULL_TEXT.slice(0, typed);
  const envAnim = settled ? { opacity: 0, y: 90 } : { opacity: 1, y: 0 };

  return (
    <div className="stage" style={{ paddingTop: pad, height: "100vh" }} data-testid="card-stage">
      <Snow count={50} swell={cardFlat} />
      <Music play={flapOpen} />
      <Surprise show={step === "card"} />

      {/* page masthead, centered across the top of the page */}
      <header
        className="absolute inset-x-0 top-0 z-20 flex flex-col items-center pt-5 sm:pt-7 pointer-events-none"
        data-testid="page-masthead"
      >
        <span className="ny-the text-[15px] sm:text-[19px]" style={{ color: "var(--ink)" }}>
          The
        </span>
        <h1
          className="ny-masthead text-[38px] sm:text-[56px] text-center"
          style={{ color: "var(--ink)", marginTop: -2 }}
        >
          New&nbsp;Yorker
        </h1>
        <span
          className="smallcaps foil-text mt-1.5 text-[10px] sm:text-[12px]"
          style={{ color: "var(--holly-red)", "--foil-base": "var(--holly-red)" }}
        >
          Christmas
        </span>
      </header>

      <div className="relative z-10 flex flex-col items-center px-5">
        {/* marginTop reserves room above: for the envelope flap, then for the card's lifting flap */}
        <motion.div style={{ marginTop }}>
          <motion.div style={{ width: boxW, height: boxH }}>
           <motion.div style={{ width: 480, height: 312, scale: scaleMV, originX: 0, originY: 0 }}>
            {/* One continuous scene. Layers, bottom to top: glow, envelope back, tucked-away flap,
                the card, envelope front, flap (while closed). The card is behind the envelope
                front while it slides up out of it, then moves in front as it settles. */}
            <motion.div
              key={run}
              className="relative isolate"
              style={{ width: 480, height: 312 }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE }}
              data-testid="scene-envelope"
            >
              <motion.div
                className="absolute inset-0"
                style={{ zIndex: 0 }}
                initial={false}
                animate={{ opacity: settled ? 1 : 0 }}
                transition={{ duration: 1.2 }}
              >
                <div className="card-glow" />
              </motion.div>

              {/* envelope back: the patterned lining you see through the opening */}
              <motion.div
                className="envelope-shadow absolute overflow-hidden rounded-[10px]"
                style={{
                  left: 5,
                  top: 0,
                  width: 470,
                  height: 312,
                  zIndex: 1,
                  background: "linear-gradient(180deg, #e2d0a8 0%, #ead9b6 100%)",
                  border: ENV_BORDER,
                }}
                initial={false}
                animate={envAnim}
                transition={ENV_EXIT}
              >
                <svg width="470" height="312" className="absolute inset-0" aria-hidden="true">
                  <defs>
                    <pattern id="liner-back" width="24" height="24" patternUnits="userSpaceOnUse">
                      <path d="M12 6 L15 12 L12 18 L9 12 Z" fill="rgba(178,34,49,0.10)" />
                      <circle cx="0" cy="0" r="1.3" fill="rgba(201,162,75,0.35)" />
                      <circle cx="24" cy="0" r="1.3" fill="rgba(201,162,75,0.35)" />
                      <circle cx="0" cy="24" r="1.3" fill="rgba(201,162,75,0.35)" />
                      <circle cx="24" cy="24" r="1.3" fill="rgba(201,162,75,0.35)" />
                    </pattern>
                  </defs>
                  <rect width="470" height="312" fill="url(#liner-back)" />
                </svg>
              </motion.div>

              {/* the card */}
              <motion.div
                className="absolute left-0"
                style={{
                  top: 6,
                  width: 480,
                  height: 300,
                  zIndex: settled ? 4 : 2,
                  pointerEvents: step === "card" ? "auto" : "none",
                }}
                initial={false}
                animate={
                  settled
                    ? { opacity: 1, scale: 1, y: 0 }
                    : cardOut
                      ? { opacity: 1, scale: 0.8, y: -120 }
                      : { opacity: 0, scale: 0.8, y: 30 }
                }
                transition={{ opacity: { duration: 0.15 }, default: { duration: settled ? 1.05 : 0.95, ease: EASE } }}
                data-testid="scene-card"
              >
                <div style={{ perspective: 1700 }}>
                  <button
                    type="button"
                    onPointerDown={onDragStart}
                    onPointerMove={onDragMove}
                    onPointerUp={onDragEnd}
                    onPointerCancel={onDragEnd}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleCard();
                      }
                    }}
                    aria-label={cardFlat ? "Drag down to close the card" : "Drag up to open the card"}
                    data-testid="card-open-toggle"
                    className="pressable relative block select-none"
                    style={{ width: 480, height: 300, touchAction: "none", cursor: "grab", outline: "none" }}
                  >
                {/* lower panel = inside with the letter (revealed when flap lifts) */}
                <div
                  className="card-face absolute inset-x-0 bottom-0 rounded-[12px] overflow-hidden"
                  style={{
                    height: 300,
                    background: "#fbf6ea",
                    border: "1px solid rgba(201,162,75,0.4)",
                  }}
                  data-testid="card-inside"
                >
                  <div className="h-full w-full px-8 py-5 flex flex-col">
                    {/* editorial dateline */}
                    <div className="flex items-center justify-between">
                      <span className="smallcaps" style={{ fontSize: 9, color: "var(--ink)" }}>
                        The New Yorker
                      </span>
                      <span className="smallcaps" style={{ fontSize: 9, color: "var(--holly-red)" }}>
                        December 25, 2026
                      </span>
                    </div>
                    <div className="ny-rule mt-1.5" />
                    <div className="ny-rule-thin mt-[3px]" />

                    <h2
                      className="ny-masthead foil-text mt-2 text-left"
                      style={{ fontSize: 24, color: "var(--ink)", "--foil-base": "var(--ink)" }}
                    >
                      Merry Christmas
                    </h2>

                    <p
                      className="font-type mt-2 text-left text-[0.82rem] whitespace-pre-line flex-1"
                      style={{ color: "var(--ink)", lineHeight: 1.65 }}
                      data-testid="card-message"
                    >
                      {visibleText}
                      {cardFlat && !done && <span className="caret" style={{ height: "1em" }} />}
                    </p>

                    {/* folio */}
                    <div className="ny-rule-thin" />
                    <div className="mt-1.5 flex items-center justify-between" style={{ color: "var(--ink)" }}>
                      <span className="smallcaps" style={{ fontSize: 8.5 }}>
                        Greetings
                      </span>
                      <Snowflake size={13} strokeWidth={1.5} style={{ color: "var(--holly-red)" }} />
                      <span className="smallcaps" style={{ fontSize: 8.5 }}>
                        No. 1 &middot; for you
                      </span>
                    </div>
                  </div>
                </div>

                {/* upper flap = the couple graphic; hinges at TOP, opens bottom-to-up */}
                <motion.div
                  className="absolute inset-x-0 bottom-0"
                  style={{
                    height: 300,
                    transformOrigin: "center top",
                    transformStyle: "preserve-3d",
                    zIndex: 10,
                    rotateX: flapRot,
                  }}
                >
                  {/* front of flap = couple illustration */}
                  <div
                    className="card-face absolute inset-0 rounded-[12px] overflow-hidden"
                    style={{ backfaceVisibility: "hidden", border: "1px solid rgba(178,34,49,0.25)" }}
                  >
                    <FoldedFront />
                  </div>
                  {/* back of flap = blank cream inside-top */}
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center rounded-[12px]"
                    style={{
                      transform: "rotateX(180deg)",
                      backfaceVisibility: "hidden",
                      background: "#fbf6ea",
                      border: "1px solid rgba(201,162,75,0.4)",
                    }}
                  >
                    <Snowflake size={22} strokeWidth={1.25} style={{ color: "rgba(178,34,49,0.5)" }} />
                    <span
                      className="ny-caption mt-3"
                      style={{ fontSize: 22, color: "rgba(43,42,38,0.55)" }}
                    >
                      Season&rsquo;s Greetings
                    </span>
                    <div
                      className="mt-3 h-px w-24"
                      style={{ background: "rgba(43,42,38,0.2)" }}
                    />
                  </div>
                </motion.div>
                  </button>
                </div>
              </motion.div>

              {/* envelope front: two side flaps and the bottom flap, with the opening between them.
                  The card slides up behind these, through the opening. */}
              <motion.button
                type="button"
                onClick={openEnvelope}
                aria-label="Open the envelope"
                data-testid="envelope-open"
                className="pressable absolute block overflow-hidden rounded-[10px]"
                style={{
                  outline: "none",
                  left: 5,
                  top: 0,
                  width: 470,
                  height: 312,
                  zIndex: 3,
                  pointerEvents: step === "sealed" && !flapOpen ? "auto" : "none",
                }}
                initial={false}
                animate={envAnim}
                transition={ENV_EXIT}
              >
                <svg width="470" height="312" viewBox="0 0 470 312" className="absolute inset-0" aria-hidden="true">
                  <defs>
                    <linearGradient id="fl-left" x1="0" y1="0" x2="1" y2="0.3">
                      <stop offset="0" stopColor="#e2cfa8" />
                      <stop offset="1" stopColor="#ebddbc" />
                    </linearGradient>
                    <linearGradient id="fl-right" x1="1" y1="0" x2="0" y2="0.3">
                      <stop offset="0" stopColor="#dcc99f" />
                      <stop offset="1" stopColor="#e8d9b7" />
                    </linearGradient>
                    <linearGradient id="fl-bottom" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#f2e7cc" />
                      <stop offset="1" stopColor="#e6d4ae" />
                    </linearGradient>
                  </defs>
                  <path d="M0 0 L235 150 L0 312 Z" fill="url(#fl-left)" />
                  <path d="M470 0 L235 150 L470 312 Z" fill="url(#fl-right)" />
                  <path d="M0 0 L235 150 L470 0" fill="none" stroke="rgba(125,96,52,0.34)" strokeWidth="1" />
                  {/* soft shadow the bottom flap throws on the side flaps */}
                  <path
                    d="M0 312 L235 138 L470 312"
                    fill="none"
                    stroke="rgba(90,66,30,0.18)"
                    strokeWidth="7"
                    style={{ filter: "blur(3px)" }}
                  />
                  <path d="M0 312 L235 138 L470 312 Z" fill="url(#fl-bottom)" />
                  <path d="M0 312 L235 138 L470 312" fill="none" stroke="rgba(125,96,52,0.38)" strokeWidth="1" />
                  <path d="M0 313.5 L235 139.5 L470 313.5" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
                  {/* outer edge (top edge is left open so the card can slide out) */}
                  <path
                    d="M10.5 0.5 Q0.5 0.5 0.5 10.5 V301.5 Q0.5 311.5 10.5 311.5 H459.5 Q469.5 311.5 469.5 301.5 V10.5 Q469.5 0.5 459.5 0.5"
                    fill="none"
                    stroke="rgba(125,96,52,0.3)"
                    strokeWidth="1"
                  />
                </svg>

                <div className="absolute inset-x-0 bottom-4 text-center">
                  <span className="smallcaps" style={{ fontSize: 8.5, color: "#8a7a55" }}>
                    The New Yorker &middot; Holiday Issue
                  </span>
                </div>

                {/* stamp + postmark, stuck on the bottom flap */}
                <div className="absolute right-4 bottom-3 w-[84px] text-center" style={{ transform: "rotate(3deg)" }}>
                  <div className="stamp mx-auto w-[58px]">
                    <img
                      src={stampImg}
                      alt="Typewriter postage stamp"
                      className="w-full h-[66px] object-cover"
                      draggable={false}
                    />
                  </div>
                  <div
                    className="mt-1 font-type text-[8px] leading-[1.25] tracking-widest"
                    style={{ color: "var(--holly-red)" }}
                  >
                    NORTH POLE
                    <br />
                    DEC 25
                  </div>
                </div>
              </motion.button>

              {/* envelope flap: closed over the opening; lifts up and tucks behind the card */}
              <motion.div
                onClick={openEnvelope}
                className="absolute"
                style={{
                  left: 5,
                  top: 0,
                  width: 470,
                  height: 186,
                  transformOrigin: "top center",
                  transformPerspective: 1100,
                  transformStyle: "preserve-3d",
                  zIndex: flapBehind ? 1 : 5,
                  cursor: step === "sealed" && !flapOpen ? "pointer" : "default",
                  pointerEvents: step === "sealed" && !flapOpen ? "auto" : "none",
                }}
                initial={false}
                animate={{ rotateX: flapOpen ? 180 : 0, ...envAnim }}
                transition={{ rotateX: { duration: 0.55, ease: EASE }, default: ENV_EXIT }}
              >
                {/* outside of the flap, with the wax seal */}
                <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
                  <svg
                    width="470"
                    height="186"
                    viewBox="0 0 470 186"
                    style={{ filter: "drop-shadow(0 5px 5px rgba(90,66,30,0.22))" }}
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id="fl-top" x1="0" y1="0" x2="0.3" y2="1">
                        <stop offset="0" stopColor="#ecdfbf" />
                        <stop offset="1" stopColor="#dcc89c" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M10 0.5 H460 Q470 0.5 465.5 8.5 L240 176 Q235 180 230 176 L4.5 8.5 Q0 0.5 10 0.5 Z"
                      fill="url(#fl-top)"
                      stroke="rgba(125,96,52,0.34)"
                      strokeWidth="1"
                    />
                    <path
                      d="M14 5 H456 L237 169"
                      fill="none"
                      stroke="rgba(255,255,255,0.45)"
                      strokeWidth="1"
                      strokeLinejoin="round"
                      opacity="0.7"
                    />
                  </svg>
                  <div
                    className="wax-seal foil-seal absolute left-1/2 flex items-center justify-center rounded-full"
                    style={{ width: 46, height: 46, top: 128, transform: "translateX(-50%)" }}
                  >
                    <Snowflake size={22} color="#f3d9c0" strokeWidth={1.75} />
                  </div>
                </div>
                {/* inside of the flap, seen once it is open */}
                <div
                  className="absolute inset-0"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <svg width="470" height="186" viewBox="0 0 470 186" aria-hidden="true">
                    <defs>
                      <pattern id="liner-flap" width="24" height="24" patternUnits="userSpaceOnUse">
                        <path d="M12 6 L15 12 L12 18 L9 12 Z" fill="rgba(178,34,49,0.10)" />
                        <circle cx="0" cy="0" r="1.3" fill="rgba(201,162,75,0.35)" />
                        <circle cx="24" cy="0" r="1.3" fill="rgba(201,162,75,0.35)" />
                        <circle cx="0" cy="24" r="1.3" fill="rgba(201,162,75,0.35)" />
                        <circle cx="24" cy="24" r="1.3" fill="rgba(201,162,75,0.35)" />
                      </pattern>
                    </defs>
                    <path
                      d="M10 0.5 H460 Q470 0.5 465.5 8.5 L240 176 Q235 180 230 176 L4.5 8.5 Q0 0.5 10 0.5 Z"
                      fill="#e9d8b3"
                      stroke="rgba(125,96,52,0.34)"
                      strokeWidth="1"
                    />
                    <path
                      d="M10 0.5 H460 Q470 0.5 465.5 8.5 L240 176 Q235 180 230 176 L4.5 8.5 Q0 0.5 10 0.5 Z"
                      fill="url(#liner-flap)"
                    />
                  </svg>
                </div>
              </motion.div>
            </motion.div>
           </motion.div>
          </motion.div>
        </motion.div>

        {/* hint + replay */}
        <div className="mt-8 flex min-h-[96px] flex-col items-center gap-3 text-center">
          <AnimatePresence mode="wait">
            {step === "sealed" ? (
              <motion.p
                key="seal-hint"
                className="font-serif-soft text-center text-xl italic"
                style={{ color: "var(--holly-red)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: flapOpen ? 0 : [0.55, 1, 0.55] }}
                transition={flapOpen ? { duration: 0.3 } : { duration: 2.4, repeat: Infinity }}
              >
                tap the envelope to open&hellip;
              </motion.p>
            ) : !cardFlat ? (
              <motion.div
                key="open-hint"
                data-testid="card-open-hint"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: [0, -4, 0] }}
                exit={{ opacity: 0 }}
                transition={{ y: { duration: 1.8, repeat: Infinity }, opacity: { duration: 0.4 } }}
                className="inline-flex items-center gap-2 font-serif-soft text-lg italic"
                style={{ color: "var(--holly-red)" }}
              >
                <ChevronUp size={18} /> press, drag up, and let go
              </motion.div>
            ) : (
              <motion.div
                key="replay"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: done ? 1 : 0.0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col items-center gap-2"
              >
                <button
                  onClick={replay}
                  data-testid="replay-button"
                  className="group inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium transition-transform duration-300 hover:scale-[1.04]"
                  style={{
                    color: "#fff",
                    background: "var(--holly-red)",
                    boxShadow: "0 12px 24px -10px rgba(178,34,49,0.7)",
                  }}
                >
                  <RotateCcw size={16} className="transition-transform duration-500 group-hover:-rotate-180" />
                  Seal it up again
                </button>
                <p className="font-serif-soft text-sm italic" style={{ color: "#8a8372" }}>
                  &hellip; or refresh to start over
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* The front of the folded card: a New Yorker "cover" using the couple cartoon */
function FoldedFront({ compact = false }) {
  return (
    <div className="relative h-full w-full" style={{ background: "#f3ead6" }}>
      <img
        src={coupleImg}
        alt="An illustration of two people resting together"
        className="h-full w-full object-cover select-none"
        draggable={false}
      />
      {/* inner keyline */}
      <div className="absolute inset-0" style={{ boxShadow: "inset 0 0 0 1px rgba(43,42,38,0.35)" }} />

      {/* dateline / price over a soft bottom scrim */}
      <div
        className="absolute inset-x-0 bottom-0 flex items-end justify-between px-3 pb-2 pt-10"
        style={{ background: "linear-gradient(180deg, transparent, rgba(243,234,214,0.96))" }}
      >
        <span
          className="smallcaps"
          style={{ fontSize: compact ? 8 : 10, color: "var(--ink)" }}
        >
          Dec. 25
        </span>
        <span
          className="ny-caption"
          style={{ fontSize: compact ? 12 : 15, color: "var(--holly-red)" }}
        >
          open me &hearts;
        </span>
      </div>
    </div>
  );
}
