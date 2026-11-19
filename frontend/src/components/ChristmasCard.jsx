import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { Snowflake, RotateCcw, ChevronUp } from "lucide-react";
import Snow from "@/components/Snow";
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
  const marginTop = useTransform([reserve, lift], ([r, l]) => Math.max(r, l));
  const drag = useRef({ active: false, startY: 0, startRot: 0, moved: false });

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
    later(() => setStep("card"), 2750);
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
    <div className="stage pt-[104px] sm:pt-[120px]" data-testid="card-stage">
      <Snow count={50} />

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
          className="smallcaps mt-1.5 text-[10px] sm:text-[12px]"
          style={{ color: "var(--holly-red)" }}
        >
          Christmas
        </span>
      </header>

      <div className="relative z-10 flex flex-col items-center px-5">
        {/* marginTop reserves room above: for the envelope flap, then for the card's lifting flap */}
        <motion.div style={{ marginTop }}>
          <div className="scale-[0.78] sm:scale-100">
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

              {/* envelope back */}
              <motion.div
                className="envelope-shadow absolute rounded-[10px]"
                style={{ left: 5, top: 0, width: 470, height: 312, zIndex: 1, background: ENV_BG, border: ENV_BORDER }}
                initial={false}
                animate={envAnim}
                transition={ENV_EXIT}
              />

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
                      ? { opacity: 1, scale: 0.8, y: -140 }
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
                    style={{ width: 480, height: 300, touchAction: "none", cursor: "grab" }}
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
                      className="ny-masthead mt-2 text-left"
                      style={{ fontSize: 24, color: "var(--ink)" }}
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

              {/* envelope front: address, stamp, seams. Opaque, so the card hides behind it. */}
              <motion.button
                type="button"
                onClick={openEnvelope}
                aria-label="Open the envelope"
                data-testid="envelope-open"
                className="pressable absolute block overflow-hidden rounded-[10px]"
                style={{
                  left: 5,
                  top: 0,
                  width: 470,
                  height: 312,
                  zIndex: 3,
                  background: ENV_BG,
                  border: ENV_BORDER,
                  pointerEvents: step === "sealed" && !flapOpen ? "auto" : "none",
                }}
                initial={false}
                animate={envAnim}
                whileHover={!flapOpen ? { y: -5 } : {}}
                transition={ENV_EXIT}
              >
                <div
                  className="absolute inset-x-0 bottom-0"
                  style={{
                    height: "62%",
                    background: "linear-gradient(180deg, rgba(255,255,255,0.12), rgba(125,96,52,0.06))",
                    clipPath: "polygon(0 42%, 50% 0, 100% 42%, 100% 100%, 0 100%)",
                    borderTop: "1px solid rgba(125,96,52,0.18)",
                  }}
                />
                <div className="absolute left-6 bottom-5">
                  <span className="smallcaps" style={{ fontSize: 8.5, color: "#8a7a55" }}>
                    The New Yorker &middot; Holiday Issue
                  </span>
                </div>
                <div className="absolute right-5 top-5 w-[92px]">
                  <div className="stamp">
                    <img
                      src={stampImg}
                      alt="Typewriter postage stamp"
                      className="w-full h-[104px] object-cover"
                      draggable={false}
                    />
                  </div>
                  <div
                    className="mt-1 text-center font-type text-[9px] tracking-widest"
                    style={{ color: "var(--holly-red)" }}
                  >
                    NORTH POLE &middot; DEC 25
                  </div>
                </div>
                <div className="absolute left-7 top-[46%] -translate-y-1/2 text-left">
                  <p className="handwriting text-sm" style={{ color: "#8a7a55" }}>
                    to my dearest
                  </p>
                  <p className="handwriting text-3xl leading-tight" style={{ color: "var(--ink)" }}>
                    sister
                  </p>
                  <div
                    className="mt-1 h-px w-40"
                    style={{ background: "linear-gradient(90deg, var(--holly-red), transparent)" }}
                  />
                </div>
              </motion.button>

              {/* envelope flap: above the card while closed, tucked behind it once open */}
              <motion.div
                onClick={openEnvelope}
                className="absolute"
                style={{
                  left: 5,
                  top: 0,
                  width: 470,
                  height: 182,
                  transformOrigin: "top center",
                  transformPerspective: 1100,
                  zIndex: flapBehind ? 1 : 5,
                  clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                  background: "linear-gradient(160deg, #e9d9b8 0%, #ddc89f 100%)",
                  cursor: step === "sealed" && !flapOpen ? "pointer" : "default",
                  pointerEvents: step === "sealed" && !flapOpen ? "auto" : "none",
                }}
                initial={false}
                animate={{ rotateX: flapOpen ? 180 : 0, ...envAnim }}
                transition={{ rotateX: { duration: 0.55, ease: EASE }, default: ENV_EXIT }}
              >
                <div
                  className="wax-seal absolute left-1/2 flex items-center justify-center rounded-full"
                  style={{ width: 46, height: 46, top: 118, transform: "translateX(-50%)" }}
                >
                  <Snowflake size={22} color="#f3d9c0" strokeWidth={1.75} />
                </div>
              </motion.div>
            </motion.div>
          </div>
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
