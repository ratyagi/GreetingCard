import React, { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

/* ---- The music (editable) ----
   Plays public/music.mp3 on a loop, quietly. Replace that file to change the song. */
const SRC = `${process.env.PUBLIC_URL || ""}/music.mp3`;
const VOLUME = 0.3; // 0 to 1, kept low on purpose

// The song starts as soon as the page opens or reloads. Browsers only allow sound after the
// visitor has clicked, tapped or pressed a key, so if sound is blocked it starts muted and
// becomes audible on the very first click / tap / key press (opening the envelope counts).
// A small speaker button mutes and unmutes it. If the file is missing, the button hides.
export default function Music() {
  const audioRef = useRef(null);
  const mutedByUser = useRef(false);
  const [audible, setAudible] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const audio = new Audio(SRC);
    audio.loop = true;
    audio.volume = VOLUME;
    audio.preload = "auto";
    audioRef.current = audio;

    const onError = () => setFailed(true);
    audio.addEventListener("error", onError);

    // first try with sound; if the browser blocks that, play muted and wait for a click
    audio
      .play()
      .then(() => setAudible(true))
      .catch(() => {
        audio.muted = true;
        audio.play().catch(() => {});
      });

    const unlock = (e) => {
      if (e.target?.closest?.("[data-music-toggle]")) return; // the button handles itself
      if (mutedByUser.current) return;
      audio.muted = false;
      if (audio.paused) {
        audio.play().then(() => setAudible(true)).catch(() => {});
      } else {
        setAudible(true);
      }
    };
    const events = ["pointerdown", "keydown", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, unlock, { passive: true }));

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, unlock));
      audio.removeEventListener("error", onError);
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const onToggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audible) {
      audio.muted = true;
      mutedByUser.current = true;
      setAudible(false);
    } else {
      mutedByUser.current = false;
      audio.muted = false;
      audio.play().then(() => setAudible(true)).catch(() => {});
    }
  };

  if (failed) return null;

  return (
    <button
      type="button"
      onClick={onToggle}
      data-music-toggle
      aria-label={audible ? "Mute the music" : "Turn the music on"}
      data-testid="music-toggle"
      className="fixed right-4 top-4 z-[45] flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-300 hover:scale-110"
      style={{
        background: "#fbf6ea",
        color: "var(--holly-red)",
        border: "1px solid rgba(201,162,75,0.6)",
        boxShadow: "0 8px 18px -10px rgba(43,42,38,0.5)",
        outline: "none",
      }}
    >
      {audible ? <Volume2 size={18} /> : <VolumeX size={18} />}
    </button>
  );
}
