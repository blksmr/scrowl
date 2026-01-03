export function IntroSection() {
  return (
    <section id="intro">
      <p >
        Scrowl is a lightweight scroll spy hook for React. Track which section is in view, highlight nav
        items, and build smooth scrolling experiences.
      </p>
      <p >
        Uses <kbd>requestAnimationFrame</kbd> with throttling for 60fps performance. Hysteresis prevents
        jittery switching near section boundaries.
      </p>
      <p className="text-sm mt-4 leading-relaxed">
        {"For the source code, check out the "}
        <a
          href="https://github.com/blksmr/scrowl"
          className="link-hover"
        >GitHub</a>
      </p>
    </section>
  );
}
