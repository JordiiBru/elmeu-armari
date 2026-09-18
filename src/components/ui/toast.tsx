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

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastItem {
  id: number;
  message: string;
  tone: Tone;
  action?: ToastAction;
}

interface ToastAPI {
  show: (message: string, tone?: Tone, action?: ToastAction) => void;
}

const ToastContext = createContext<ToastAPI | null>(null);

export function useToast(): ToastAPI {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

// Long enough to read one line, short enough not to loiter. Exported so
// an "undo" caller (OutfitLibrary's unfavourite) can delay the write it
// is describing until exactly the moment the button offering to cancel
// it disappears — the window to undo is the toast's own lifetime, not a
// second timer that could drift from what's on screen.
export const TOAST_DURATION_MS = 2600;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback<ToastAPI["show"]>(
    (message, tone = "neutral", action) => {
      const id = ++idRef.current;
      setItems((prev) => [...prev, { id, message, tone, action }]);
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
    const hideAt = window.setTimeout(() => setClosing(true), TOAST_DURATION_MS - 300);
    const doneAt = window.setTimeout(onDone, TOAST_DURATION_MS);
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
        "flex items-center gap-4",
        "font-serif italic type-small text-text-primary",
        "transition-[opacity,transform] duration-[var(--duration-base)] ease-[var(--ease-standard)]",
        shown && !closing ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
      ].join(" ")}
    >
      <span>{item.message}</span>
      {item.action && (
        <button
          type="button"
          onClick={() => {
            item.action?.onClick();
            onDone();
          }}
          className="not-italic underline underline-offset-4 decoration-border-strong hover:decoration-text-primary transition-colors"
        >
          {item.action.label}
        </button>
      )}
    </div>
  );
}
