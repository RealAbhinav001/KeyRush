import { Suspense, lazy, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";
import "./landing.css";

gsap.registerPlugin(ScrollTrigger, SplitText, Flip, useGSAP);

const HeroScene = lazy(() => import("./landing/HeroScene.jsx"));

const REDUCED = "(prefers-reduced-motion: reduce)";

const drivers = {
  rival: { name: "rival_dev", tone: "fastest" },
  you: { name: "You", tone: "pb" },
  ghost: { name: "Your ghost", tone: "ghost" },
  mira: { name: "mira.codes", tone: "plain" },
};

// Running order at each point of the scroll-driven race.
const timing = [
  {
    order: ["rival", "mira", "you", "ghost"],
    wpm: { rival: 98, mira: 92, you: 88, ghost: 86 },
  },
  {
    order: ["rival", "you", "mira", "ghost"],
    wpm: { rival: 101, you: 95, mira: 91, ghost: 89 },
  },
  {
    order: ["you", "rival", "ghost", "mira"],
    wpm: { you: 104, rival: 102, ghost: 93, mira: 90 },
  },
];

const modes = [
  {
    name: "Classic",
    line: "The quick brown fox jumps over the lazy dog.",
    text: "Quotes and prose. Pure speed and accuracy, the way typing races started.",
  },
  {
    name: "Code",
    line: "const lap = await race.start(room);",
    text: "Real code snippets. Brackets, semicolons and indents: the keys you actually press at work.",
  },
  {
    name: "Ghost replay",
    line: "const delta = you.time - ghost.time;",
    text: "Race a keystroke-perfect replay of your own best run. Beat it and it becomes your new ghost.",
  },
];

const useSmoothScroll = () => {
  useEffect(() => {
    if (window.matchMedia(REDUCED).matches) return undefined;
    const lenis = new Lenis({ lerp: 0.1 });
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);
};

const supportsWebGL = () => {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
};

const Landing = ({ serverStatus }) => {
  const root = useRef(null);
  const heroRef = useRef(null);
  const towerRef = useRef(null);
  const flipState = useRef(null);
  const stageRef = useRef(0);
  const [stage, setStage] = useState(0);
  const [webgl] = useState(supportsWebGL);
  const [reduced] = useState(() => window.matchMedia(REDUCED).matches);
  const [heroInView, setHeroInView] = useState(true);

  useSmoothScroll();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Pause the 3D scene whenever the hero is off screen.
      ScrollTrigger.create({
        trigger: heroRef.current,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => setHeroInView(self.isActive),
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Hero headline: letters slide up out of a mask.
        const split = SplitText.create(".kr3-hero h1", { type: "words,chars", mask: "words" });
        gsap.from(split.chars, {
          yPercent: 110,
          duration: 0.9,
          ease: "power4.out",
          stagger: 0.025,
          delay: 0.2,
        });
        gsap.from(".kr3-hero-fade", {
          autoAlpha: 0,
          y: 20,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.12,
          delay: 0.7,
        });

        // Lights out: five columns light up as you scroll, then all go dark.
        const lights = gsap.timeline({
          scrollTrigger: {
            trigger: ".kr3-lights",
            start: "top top",
            end: "+=1600",
            scrub: 0.4,
            pin: true,
          },
        });
        gsap.utils.toArray(".kr3-gantry-col").forEach((col) => {
          lights.to(col.querySelectorAll(".kr3-bulb-red"), {
            backgroundColor: "#ff3b2f",
            boxShadow: "0 0 28px 6px rgba(255, 59, 47, 0.65)",
            duration: 1,
            ease: "none",
          });
          lights.to({}, { duration: 0.35 });
        });
        lights
          .to(".kr3-bulb-red", {
            backgroundColor: "#2a1514",
            boxShadow: "0 0 0 0 rgba(0,0,0,0)",
            duration: 0.25,
          })
          .from(".kr3-lights-go", { autoAlpha: 0, scale: 0.9, duration: 0.8 }, "<")
          .to(".kr3-lights-wait", { autoAlpha: 0, duration: 0.3 }, "<")
          .to({}, { duration: 0.8 });

        // Live timing: the order changes as the race progresses.
        ScrollTrigger.create({
          trigger: ".kr3-timing",
          start: "top top",
          end: "+=1400",
          pin: true,
          onUpdate: (self) => {
            const next = Math.min(timing.length - 1, Math.floor(self.progress * timing.length));
            if (next === stageRef.current) return;
            flipState.current = Flip.getState(".kr3-row");
            stageRef.current = next;
            setStage(next);
          },
        });

        // Ghost: the gap counts down from behind to ahead.
        const gap = { value: 1.2 };
        gsap
          .timeline({
            scrollTrigger: {
              trigger: ".kr3-ghost",
              start: "top 70%",
              end: "bottom 60%",
              scrub: 0.6,
            },
          })
          .to(gap, {
            value: -0.84,
            ease: "none",
            onUpdate: () => {
              const node = document.querySelector(".kr3-delta-num");
              if (!node) return;
              const v = gap.value;
              node.textContent = `${v > 0 ? "+" : ""}${v.toFixed(2)}s`;
              node.dataset.ahead = v < 0 ? "true" : "false";
            },
          })
          .fromTo(".kr3-bar-you", { scaleX: 0.55 }, { scaleX: 1, ease: "none" }, 0)
          .fromTo(".kr3-bar-ghost", { scaleX: 0.7 }, { scaleX: 0.86, ease: "none" }, 0);

        // Gentle reveal for section headings.
        gsap.utils.toArray(".kr3-reveal").forEach((node) => {
          gsap.from(node, {
            autoAlpha: 0,
            y: 40,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: node, start: "top 85%" },
          });
        });
      });

      // Modes slide sideways on wide screens only; on phones they stack.
      mm.add("(min-width: 900px) and (prefers-reduced-motion: no-preference)", () => {
        const track = document.querySelector(".kr3-modes-track");
        gsap.to(track, {
          x: () => -(track.scrollWidth - window.innerWidth + 80),
          ease: "none",
          scrollTrigger: {
            trigger: ".kr3-modes",
            start: "top top",
            end: () => `+=${track.scrollWidth - window.innerWidth + 80}`,
            scrub: 0.5,
            pin: true,
            invalidateOnRefresh: true,
          },
        });
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  // Animate rows from their old positions after the order changes.
  useLayoutEffect(() => {
    if (!flipState.current) return;
    Flip.from(flipState.current, { duration: 0.7, ease: "power3.inOut" });
    flipState.current = null;
  }, [stage]);

  const current = timing[stage];

  return (
    <div className="kr3" ref={root}>
      <a className="kr3-skip" href="#main">
        Skip to content
      </a>

      <header className="kr3-nav">
        <a className="kr3-logo" href="/" aria-label="Keyrush home">
          <span className="kr3-logo-mark" aria-hidden="true" />
          Keyrush
        </a>
        <nav aria-label="Main">
          <ul>
            <li>
              <a href="#lights">Race start</a>
            </li>
            <li>
              <a href="#timing">Live timing</a>
            </li>
            <li>
              <a href="#modes">Modes</a>
            </li>
            <li>
              <a href="#ghost">Ghost</a>
            </li>
          </ul>
        </nav>
        <a className="kr3-btn kr3-btn-small" href="/signup">
          Create account
        </a>
      </header>

      <main id="main">
        <section className="kr3-hero" ref={heroRef} aria-labelledby="hero-title">
          <div className="kr3-hero-scene" aria-hidden="true">
            {webgl && !reduced ? (
              <Suspense fallback={<div className="kr3-hero-fallback" />}>
                <HeroScene running={heroInView} />
              </Suspense>
            ) : (
              <div className="kr3-hero-fallback" />
            )}
          </div>
          <div className="kr3-hero-shade" aria-hidden="true" />
          <div className="kr3-hero-copy">
            <h1 id="hero-title">Race on real code.</h1>
            <p className="kr3-lede kr3-hero-fade">
              A multiplayer typing race where the track is the passage. Every correct key moves your
              car. Every mistake costs you time.
            </p>
            <div className="kr3-hero-actions kr3-hero-fade">
              <a className="kr3-btn" href="/signup">
                Start racing
              </a>
              <a className="kr3-btn kr3-btn-ghost" href="#lights">
                See a race start
              </a>
            </div>
          </div>
          <p className="kr3-hero-hint kr3-hero-fade" aria-hidden="true">
            Scroll to start the lights
          </p>
        </section>

        <section id="lights" className="kr3-lights" aria-labelledby="lights-title">
          <h2 id="lights-title" className="kr3-sr">
            How a race starts
          </h2>
          <div className="kr3-gantry" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((col) => (
              <div className="kr3-gantry-col" key={col}>
                <span className="kr3-bulb" />
                <span className="kr3-bulb" />
                <span className="kr3-bulb kr3-bulb-red" />
                <span className="kr3-bulb kr3-bulb-red" />
              </div>
            ))}
          </div>
          <div className="kr3-lights-text">
            <p className="kr3-lights-wait">Everyone in the room waits for the same five lights.</p>
            <p className="kr3-lights-go">
              Lights out.
              <span>The passage unlocks for every driver at the same moment.</span>
            </p>
          </div>
        </section>

        <section id="timing" className="kr3-timing" aria-labelledby="timing-title">
          <div className="kr3-timing-copy">
            <h2 id="timing-title">Live timing, like the pit wall.</h2>
            <p>
              Positions update as people type. Purple is the fastest driver on track, green is a
              personal best, and your ghost is the run you have to beat.
            </p>
          </div>
          <div className="kr3-tower" ref={towerRef} aria-live="off">
            <div className="kr3-tower-head">
              <span className="kr3-live-dot" aria-hidden="true" />
              Room 4F2A, code mode
            </div>
            <ol>
              {current.order.map((id, index) => (
                <li key={id} data-flip-id={id} className={`kr3-row kr3-tone-${drivers[id].tone}`}>
                  <span className="kr3-row-pos">{index + 1}</span>
                  <span className="kr3-row-name">{drivers[id].name}</span>
                  <span className="kr3-row-wpm">
                    {current.wpm[id]}
                    <small>wpm</small>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="modes" className="kr3-modes" aria-labelledby="modes-title">
          <div className="kr3-modes-track">
            <div className="kr3-modes-intro">
              <h2 id="modes-title">Pick your track.</h2>
              <p>Three ways to race. Same lights, same rules.</p>
            </div>
            {modes.map((mode) => (
              <article className="kr3-mode" key={mode.name}>
                <h3>{mode.name}</h3>
                <code className="kr3-mode-line">{mode.line}</code>
                <p>{mode.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="ghost" className="kr3-ghost" aria-labelledby="ghost-title">
          <div className="kr3-ghost-copy kr3-reveal">
            <h2 id="ghost-title">Your best run never retires.</h2>
            <p>
              Every finished race is saved keystroke by keystroke. Next time, it races alongside
              you, so you always know whether you are ahead of yourself.
            </p>
            <p>Results are checked on the server, so a ghost is always a run that happened.</p>
          </div>
          <div className="kr3-delta">
            <span className="kr3-delta-label">Gap to your ghost</span>
            <span className="kr3-delta-num" data-ahead="true">
              -0.84s
            </span>
            <div className="kr3-delta-bars" aria-hidden="true">
              <span className="kr3-delta-row">
                <span>You</span>
                <span className="kr3-bar kr3-bar-you" />
              </span>
              <span className="kr3-delta-row">
                <span>Ghost</span>
                <span className="kr3-bar kr3-bar-ghost" />
              </span>
            </div>
          </div>
        </section>

        <section className="kr3-cta" aria-labelledby="cta-title">
          <h2 id="cta-title" className="kr3-reveal">
            Your car is on the grid.
          </h2>
          <a className="kr3-btn" href="/signup">
            Create account
          </a>
        </section>
      </main>

      <footer className="kr3-foot">
        <span>Keyrush, built in public.</span>
        <a href="https://github.com/RealAbhinav001/KeyRush">Source on GitHub</a>
        <span className={`kr3-status kr3-status-${serverStatus}`}>
          <span className="kr3-status-dot" aria-hidden="true" />
          {serverStatus === "ok" && "Server online"}
          {serverStatus === "error" && "Server offline"}
          {serverStatus === "loading" && "Checking server"}
        </span>
      </footer>
    </div>
  );
};

export default Landing;
