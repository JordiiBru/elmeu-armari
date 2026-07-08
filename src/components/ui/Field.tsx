import type { ReactNode } from "react";
import { Text } from "./Text";

interface Props {
  label: string;
  required?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Canonical form field: caption label, control, optional hint or
 * error line. Groups labels so pages never repeat the microcaps
 * pattern by hand.
 */
export function Field({
  label,
  required,
  hint,
  error,
  htmlFor,
  children,
  className,
}: Props) {
  return (
    <div className={`flex flex-col gap-2 ${className ?? ""}`}>
      <label htmlFor={htmlFor}>
        <Text variant="caption">
          {label}
          {required && <span aria-hidden> ·</span>}
        </Text>
      </label>
      {children}
      {error ? (
        <Text variant="small" italic className="text-danger font-serif">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="small" tone="secondary" italic className="font-serif">
          {hint}
        </Text>
      ) : null}
    </div>
  );
}
