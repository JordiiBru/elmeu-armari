/**
 * Textura de paper — gra molt subtil, constant, sobre tota la vista.
 * SVG fractal noise en linia (inline base64). Opacitat ~2%. No canvia mai.
 * Dona sensacio de material imprès (Kinfolk, MUJI, revistes japoneses 90s).
 */

const NOISE_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'>
    <filter id='n'>
      <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/>
      <feColorMatrix values='0 0 0 0 0.18  0 0 0 0 0.18  0 0 0 0 0.17  0 0 0 0.55 0'/>
    </filter>
    <rect width='100%' height='100%' filter='url(#n)'/>
  </svg>`,
)}`;

export default function PaperTexture() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{
        backgroundImage: `url("${NOISE_SVG}")`,
        backgroundRepeat: "repeat",
        opacity: 0.06,
        mixBlendMode: "multiply",
      }}
    />
  );
}
