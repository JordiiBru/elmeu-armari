"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import type { GarmentWithColors } from "@/lib/prendas/types";

const GAP = 12;

interface Props {
  items: GarmentWithColors[];
  index: number;
  onChange: (i: number) => void;
  label: string;
  priority?: boolean;
}

export function CarouselRow({ items, index, onChange, label, priority }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);
  const startTime = useRef<number>(0);
  const [dragDx, setDragDx] = useState(0);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const compute = () => setDims({ w: el.clientWidth, h: el.clientHeight });
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Deixem marge vertical dins el viewport perquè les fitxes escalades i el
  // moviment no toquin ni el label superior ni la seguent filera.
  const tileSize = Math.max(80, Math.min(dims.h * 0.9, dims.w * 0.68, 320));
  const step = tileSize + GAP;

  const commit = useCallback(
    (dx: number, dt: number) => {
      const threshold = tileSize * 0.22;
      const velocity = Math.abs(dx) / Math.max(dt, 1);
      let next = index;
      if (dx <= -threshold || (dx < 0 && velocity > 0.5)) next = index + 1;
      else if (dx >= threshold || (dx > 0 && velocity > 0.5)) next = index - 1;
      next = Math.max(0, Math.min(items.length - 1, next));
      if (next !== index) onChange(next);
      setDragDx(0);
    },
    [index, items.length, onChange, tileSize],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (items.length <= 1) return;
    startX.current = e.clientX;
    startTime.current = performance.now();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    setDragDx(e.clientX - startX.current);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    const dt = performance.now() - startTime.current;
    startX.current = null;
    commit(dx, dt);
  };
  const onPointerCancel = () => {
    startX.current = null;
    setDragDx(0);
  };

  const go = useCallback(
    (i: number) => {
      const clamped = Math.max(0, Math.min(items.length - 1, i));
      if (clamped !== index) onChange(clamped);
    },
    [index, items.length, onChange],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); go(index - 1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); go(index + 1); }
  };

  const centerOffset = dims.w / 2 - tileSize / 2;
  const trackLeft = centerOffset - index * step + dragDx;

  return (
    <section
      className="flex flex-col h-full outline-none"
      role="region"
      aria-roledescription="carrusel"
      aria-label={label}
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <RowHeader label={label} index={index} total={items.length} />

      <div
        ref={viewportRef}
        className="relative flex-1 min-h-0 overflow-hidden touch-pan-y select-none"
        style={{ cursor: items.length > 1 ? "grab" : "default" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        {items.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="font-serif italic text-xs text-foreground-secondary">
              sense peces
            </p>
          </div>
        ) : (
          <div
            className="absolute top-1/2 flex items-center will-change-transform"
            style={{
              gap: GAP,
              transform: `translate3d(${trackLeft}px, -50%, 0)`,
              transition: dragDx === 0 ? "transform 500ms cubic-bezier(0.22, 1, 0.36, 1)" : "none",
            }}
          >
            {items.map((g, i) => {
              const dist = Math.abs(i - index);
              const isCenter = i === index;
              return (
                <div
                  key={g.id}
                  className="shrink-0 transition-[opacity,transform] duration-500 ease-out"
                  style={{
                    width: tileSize,
                    height: tileSize,
                    opacity: isCenter ? 1 : Math.max(0.25, 0.85 - dist * 0.35),
                    transform: `scale(${isCenter ? 1 : 0.88})`,
                  }}
                  aria-hidden={!isCenter}
                >
                  <Tile garment={g} priority={priority && isCenter} sizes={tileSize} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function RowHeader({ label, index, total }: { label: string; index: number; total: number }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-6 md:px-10 pt-1 pb-2 shrink-0">
      <span className="text-[10px] tracking-[0.25em] uppercase text-foreground-secondary truncate">
        {label}
      </span>
      <span className="text-[10px] tracking-[0.2em] uppercase text-foreground-secondary tabular-nums shrink-0">
        {total === 0 ? "0" : `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`}
      </span>
    </div>
  );
}

function Tile({ garment, priority, sizes }: { garment: GarmentWithColors; priority?: boolean; sizes: number }) {
  return (
    <div className="relative w-full h-full overflow-hidden bg-card">
      {garment.image ? (
        <Image
          src={`/api/uploads/${garment.image}?v=${garment.updatedAt.getTime()}`}
          alt=""
          fill
          unoptimized
          sizes={`${sizes}px`}
          className="object-cover"
          priority={priority}
          draggable={false}
        />
      ) : (
        <div className="flex w-full h-full">
          {garment.colors.map((c) => (
            <div key={c.id} className="flex-1" style={{ backgroundColor: c.hex }} />
          ))}
        </div>
      )}
    </div>
  );
}

