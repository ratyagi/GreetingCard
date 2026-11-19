import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

export default function ChristmasCard() {
  // 'sealed' -> (click) -> 'card' (folded, shows graphic) -> (click) -> flat & typing
  const [step, setStep] = useState("sealed");
  const [flapOpen, setFlapOpen] = useState(false);
  const [cardOut, setCardOut] = useState(false);
  const [cardFlat, setCardFlat] = useState(false);
  const [typed, setTyped] = useState(0);
  const timers = useRef([]);
  const typeTimer = useRef(null);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const openEnvelope = useCallback(() => {
    if (step !== "sealed") return;
    setFlapOpen(true);
    timers.current.push(setTimeout(() => setCardOut(true), 650));
    timers.current.push(setTimeout(() => setStep("card"), 2100));
  }, [step]);

  const toggleCard = useCallback(() => {
    if (step !== "card") return;
    setCardFlat((v) => !v);
  }, [step]);

  const replay = useCallback(() => {
    clearTimers();
    clearInterval(typeTimer.current);
    setCardFlat(false);
    setCardOut(false);
    setFlapOpen(false);
    setTyped(0);
    setStep("sealed");
  }, []);

  /* typewriter typing — only once the card is opened flat */
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

  return (
    <div className="stage" data-testid="card-stage">
      <Snow count={50} />

      <AnimatePresence mode="wait">
        {step === "sealed" ? (
          /* ==================== SCENE 1 · THE ENVELOPE ==================== */
          <motion.div
            key="envelope"
            className="relative z-10 flex flex-col items-center"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, filter: "blur(4px)" }}
            transition={{ duration: 0.8, ease: EASE }}
            data-testid="scene-envelope"
          >
            <div className="scale-[0.74] sm:scale-100">
              <motion.button
                type="button"
                onClick={openEnvelope}
                aria-label="Open the envelope"
                data-testid="envelope-open"
                className="pressable envelope-shadow relative block rounded-[10px]"
                style={{
                  width: 470,
                  height: 312,
                  background: "linear-gradient(160deg, #efe2c6 0%, #e7d6b4 100%)",
                  border: "1px solid rgba(125,96,52,0.3)",
                  perspective: 1100,
                }}
                whileHover={!flapOpen ? { y: -6 } : {}}
                transition={{ duration: 0.4 }}
              >
                {/* front face: address + stamp */}
                <div className="absolute inset-0 overflow-hidden rounded-[10px]">
                  {/* pocket seams */}
                  <div
                    className="absolute inset-x-0 bottom-0"
                    style={{
                      height: "62%",
                      background: "linear-gradient(180deg, rgba(255,255,255,0.12), rgba(125,96,52,0.06))",
                      clipPath: "polygon(0 42%, 50% 0, 100% 42%, 100% 100%, 0 100%)",
                      borderTop: "1px solid rgba(125,96,52,0.18)",
                    }}
                  />
                  {/* subscriber masthead label */}
                  <div className="absolute left-6 bottom-5">
                    <span className="smallcaps" style={{ fontSize: 8.5, color: "#8a7a55" }}>
                      The New Yorker &middot; Holiday Issue
                    </span>
                  </div>
                  {/* stamp */}
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
                  {/* address */}
                  <div className="absolute left-7 top-[46%] -translate-y-1/2">
                    <p className="handwriting text-sm" style={{ color: "#8a7a55" }}>
                      to my dearest
                    </p>
                    <p
                      className="handwriting text-3xl leading-tight"
                      style={{ color: "var(--ink)" }}
                    >
                      sister
                    </p>
                    <div
                      className="mt-1 h-px w-40"
                      style={{ background: "linear-gradient(90deg, var(--holly-red), transparent)" }}
                    />
                  </div>
                </div>

                {/* flap */}
                <motion.div
                  className="absolute left-0 top-0"
                  style={{
                    width: 470,
                    height: 182,
                    transformOrigin: "top center",
                    transformStyle: "preserve-3d",
                    zIndex: 30,
                    clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                    background: "linear-gradient(160deg, #e9d9b8 0%, #ddc89f 100%)",
                    borderBottom: "1px solid rgba(125,96,52,0.25)",
                  }}
                  initial={false}
                  animate={{ rotateX: flapOpen ? 180 : 0 }}
                  transition={{ duration: 0.9, ease: EASE }}
                >
                  {/* wax seal at the tip */}
                  <div
                    className="wax-seal absolute left-1/2 flex items-center justify-center rounded-full"
                    style={{
                      width: 46,
                      height: 46,
                      top: 118,
                      transform: "translateX(-50%)",
                    }}
                  >
                    <Snowflake size={22} color="#f3d9c0" strokeWidth={1.75} />
                  </div>
                </motion.div>

                {/* the folded card peeking / sliding out from inside */}
                <motion.div
                  className="absolute left-1/2"
                  style={{ width: 410, top: 40, zIndex: 20 }}
                  initial={false}
                  animate={
                    cardOut
                      ? { y: -150, x: "-50%", opacity: 1 }
                      : { y: 14, x: "-50%", opacity: 0 }
                  }
                  transition={{ duration: 1.3, ease: EASE }}
                >
                  <FoldedFront compact />
                </motion.div>
              </motion.button>
            </div>

            <motion.p
              className="font-serif-soft mt-9 text-center text-xl italic"
              style={{ color: "var(--holly-red)" }}
              animate={{ opacity: flapOpen ? 0 : [0.55, 1, 0.55] }}
              transition={flapOpen ? { duration: 0.3 } : { duration: 2.4, repeat: Infinity }}
            >
              tap the envelope to open&hellip;
            </motion.p>
          </motion.div>
        ) : (
          /* ==================== SCENE 2 · THE FOLDED CARD ==================== */
          <motion.div
            key="card"
            className="relative z-10 flex flex-col items-center px-5"
            initial={{ opacity: 0, scale: 0.86, y: -30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE }}
            data-testid="scene-card"
          >
            <div className="card-glow" />

            <div className="scale-[0.82] sm:scale-100" style={{ perspective: 1700 }}>
              <button
                type="button"
                onClick={toggleCard}
                aria-label={cardFlat ? "Close the card" : "Open the card"}
                data-testid="card-open-toggle"
                className="pressable relative block"
                style={{ width: 480, height: 300 }}
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
                  }}
                  initial={false}
                  animate={{ rotateX: cardFlat ? -172 : 0 }}
                  transition={{ duration: 1.1, ease: EASE }}
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

            {/* hint + replay */}
            <div className="mt-8 flex flex-col items-center gap-3 text-center">
              <AnimatePresence mode="wait">
                {!cardFlat ? (
                  <motion.button
                    key="open-hint"
                    type="button"
                    onClick={toggleCard}
                    data-testid="card-open-hint"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: [0, -4, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ y: { duration: 1.8, repeat: Infinity }, opacity: { duration: 0.4 } }}
                    className="pressable inline-flex items-center gap-2 font-serif-soft text-lg italic"
                    style={{ color: "var(--holly-red)" }}
                  >
                    <ChevronUp size={18} /> lift the card open
                  </motion.button>
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
          </motion.div>
        )}
      </AnimatePresence>
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

      {/* masthead over a soft top scrim */}
      <div
        className="absolute inset-x-0 top-0 flex flex-col items-center pt-2.5 pb-6"
        style={{ background: "linear-gradient(180deg, rgba(243,234,214,0.96), transparent)" }}
      >
        <span className="ny-the" style={{ fontSize: compact ? 11 : 14, color: "var(--ink)" }}>
          The
        </span>
        <span
          className="ny-masthead"
          style={{ fontSize: compact ? 22 : 30, color: "var(--ink)", marginTop: -2 }}
        >
          New&nbsp;Yorker
        </span>
      </div>

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
