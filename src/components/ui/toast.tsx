"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Tone = "neutral" | "success" | "danger";

interface ToastItem {
  id: number;
  message: string;
  tone: Tone;
}

interface ToastAPI {
  show: (message: string, tone?: Tone) => void;
}

const ToastContext = createContext<ToastAPI | null>(null);

export function useToast(): ToastAPI {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const DURATION_MS = 3400;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback<ToastAPI["show"]>(
    (message, tone = "neutral") => {
      const id = ++idRef.current;
      setItems((prev) => [...prev, { id, message, tone }]);
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2"
      >
        {items.map((t) => (
          <ToastLine key={t.id} item={t} onDone={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastLine({
  item,
  onDone,
}: {
  item: ToastItem;
  onDone: () => void;
}) {
  const [shown, setShown] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    const hideAt = window.setTimeout(() => setClosing(true), DURATION_MS - 300);
    const doneAt = window.setTimeout(onDone, DURATION_MS);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(hideAt);
      window.clearTimeout(doneAt);
    };
  }, [onDone]);

  const toneBorder =
    item.tone === "danger"
      ? "border-danger"
      : item.tone === "success"
        ? "border-success"
        : "border-border-strong";

  return (
    <div
      className={[
        "pointer-events-auto bg-elevated border-t border-b px-5 py-2 shadow-[var(--shadow-2)]",
        toneBorder,
        "font-serif italic type-small text-text-primary",
        "transition-[opacity,transform] duration-[var(--duration-base)] ease-[var(--ease-standard)]",
        shown && !closing ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
      ].join(" ")}
    >
      {item.message}
    </div>
  );
}
