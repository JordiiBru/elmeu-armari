"use client";

/**
 * Fons ambient — 2 taques molt suaus i borroses que floten lentament,
 * pintades amb els accents de l'estacio activa. Sense estacio, respiren
 * en to neutre. Es la "il·luminacio" de la sala.
 *
 * No es cap gradient cridaner: opacitat baixa, blur alt, cicles molt lents
 * (28-34s), moviments minims (± 4-6% de la pantalla).
 */
export default function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
    >
      <div
        className="absolute rounded-full blur-3xl"
        style={{
          top: "8%",
          left: "6%",
          width: "70vmin",
          height: "70vmin",
          backgroundColor: "var(--accent-1)",
          opacity: 0.28,
          animation: "armari-drift-1 28s ease-in-out infinite",
          transition: "background-color 900ms cubic-bezier(0.25,0.1,0.25,1)",
          willChange: "transform, opacity",
        }}
      />
      <div
        className="absolute rounded-full blur-3xl"
        style={{
          bottom: "6%",
          right: "8%",
          width: "60vmin",
          height: "60vmin",
          backgroundColor: "var(--accent-3)",
          opacity: 0.22,
          animation: "armari-drift-2 34s ease-in-out infinite",
          transition: "background-color 900ms cubic-bezier(0.25,0.1,0.25,1)",
          willChange: "transform, opacity",
        }}
      />
      <div
        className="absolute rounded-full blur-3xl"
        style={{
          top: "40%",
          left: "50%",
          width: "50vmin",
          height: "50vmin",
          backgroundColor: "var(--accent-4)",
          opacity: 0.14,
          animation: "armari-drift-3 40s ease-in-out infinite",
          transition: "background-color 900ms cubic-bezier(0.25,0.1,0.25,1)",
          willChange: "transform, opacity",
        }}
      />
      <style>{`
        @keyframes armari-drift-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(4vw, 3vh) scale(1.05); }
        }
        @keyframes armari-drift-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(-3vw, -4vh) scale(1.07); }
        }
        @keyframes armari-drift-3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50%      { transform: translate(-52%, -48%) scale(1.06); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="armari-drift"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
