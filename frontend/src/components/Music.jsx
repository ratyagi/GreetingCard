import React, { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

/* ---- The music (editable) ----
   Faouzia - Fur Elise (Live Performance), her official upload.
   It plays through a tiny hidden YouTube player, so nothing is copied into this project.
   Change VIDEO_ID to use a different video. */
const VIDEO_ID = "2Kw8g6PjnvA";
const VOLUME = 18; // 0 to 100, kept low on purpose
const YT_ORIGIN = "https://www.youtube-nocookie.com";

// The song starts as soon as the page opens or reloads. Browsers do not allow sound before
// the visitor has clicked, tapped or pressed a key, so it starts muted and becomes audible on
// the very first click / tap / key press (opening the envelope counts). A small speaker
// button mutes and unmutes it. If YouTube refuses to play the video, the button disappears.
export default function Music() {
  const frame = useRef(null);
  const attempts = useRef(0);
  const [loaded, setLoaded] = useState(false);
  const [unlocked, setUnlocked] = useState(false); // the visitor has interacted with the page
  const [userMuted, setUserMuted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);

  const send = useCallback((func, args = []) => {
    try {
      frame.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "*");
    } catch (e) {
      /* the player is not ready yet; the effects below ask again */
    }
  }, []);

  // first click / tap / key press anywhere unlocks the sound (except on the speaker button,
  // which handles itself)
  useEffect(() => {
    const unlock = (e) => {
      if (e.target?.closest?.("[data-music-toggle]")) return;
      setUnlocked(true);
    };
    const events = ["pointerdown", "keydown", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, unlock, { passive: true }));
    return () => events.forEach((ev) => window.removeEventListener(ev, unlock));
  }, []);

  // listen to the player so we know whether it is really playing, or was refused
  useEffect(() => {
    const onMessage = (e) => {
      if (e.origin !== YT_ORIGIN || typeof e.data !== "string") return;
      let data;
      try {
        data = JSON.parse(e.data);
      } catch (err) {
        return;
      }
      if (data.event === "onError") setFailed(true);
      const state = data.event === "onStateChange" ? data.info : data.info?.playerState;
      if (typeof state === "number") setPlaying(state === 1);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // make sure it is playing (the player needs a moment before it listens, so ask a few times)
  useEffect(() => {
    if (!loaded || failed || playing) return undefined;
    attempts.current = 0;
    const ask = () => {
      frame.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "listening", id: 1, channel: "widget" }),
        "*",
      );
      send("playVideo");
      attempts.current += 1;
    };
    ask();
    const id = setInterval(() => {
      if (attempts.current >= 10) clearInterval(id);
      else ask();
    }, 900);
    return () => clearInterval(id);
  }, [loaded, failed, playing, send]);

  // sound on or off
  useEffect(() => {
    if (!loaded || failed) return;
    if (unlocked && !userMuted) {
      send("unMute");
      send("setVolume", [VOLUME]);
      send("playVideo");
    } else {
      send("mute");
    }
  }, [loaded, failed, playing, unlocked, userMuted, send]);

  const audible = unlocked && !userMuted;

  const onToggle = () => {
    if (!audible) {
      setUnlocked(true);
      setUserMuted(false);
    } else {
      setUserMuted(true);
    }
  };

  if (failed) return null;

  const src =
    `${YT_ORIGIN}/embed/${VIDEO_ID}?enablejsapi=1&autoplay=1&mute=1&controls=0&loop=1&playlist=${VIDEO_ID}` +
    `&playsinline=1&rel=0&modestbranding=1&origin=${encodeURIComponent(window.location.origin)}`;

  return (
    <>
      <iframe
        ref={frame}
        title="Background music"
        src={src}
        allow="autoplay; encrypted-media"
        tabIndex={-1}
        aria-hidden="true"
        onLoad={() => {
          setLoaded(true);
          frame.current?.contentWindow?.postMessage(
            JSON.stringify({ event: "listening", id: 1, channel: "widget" }),
            "*",
          );
        }}
        style={{
          // YouTube needs a player of at least 200x200 that is inside the window, otherwise
          // it may refuse to autoplay. So it sits there, but is invisible and untouchable.
          position: "fixed",
          left: 0,
          bottom: 0,
          width: 200,
          height: 200,
          border: 0,
          opacity: 0.01,
          zIndex: -1,
          pointerEvents: "none",
        }}
      />
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
    </>
  );
}
