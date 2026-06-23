const EQ_BARS = [
  0.35, 0.6, 0.45, 0.8, 0.55, 1, 0.7, 0.9, 0.5, 0.75, 0.4, 0.65, 0.85, 0.45,
  0.7, 0.55, 0.95, 0.6, 0.4, 0.8, 0.5, 0.7, 0.35, 0.6,
];

/** The hero soundwave equalizer — the original, kept simple, just sized up. */
export function HeroEqualizer() {
  return (
    <div className="mt-16 flex h-32 w-full max-w-2xl items-center justify-center gap-2 sm:gap-3">
      {EQ_BARS.map((height, i) => (
        <div
          key={i}
          className="eq-bar w-3 rounded-full bg-gradient-to-t from-amber-500/40 via-amber-400/85 to-orange-300"
          style={{
            height: `${height * 100}%`,
            animationDelay: `${(i * 97) % 1100}ms`,
            animationDuration: `${900 + ((i * 131) % 600)}ms`,
          }}
        />
      ))}
    </div>
  );
}
