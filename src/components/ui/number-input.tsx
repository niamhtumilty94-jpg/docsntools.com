import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NumberInputProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  /** Value used when the field is left empty. Defaults to 0. */
  emptyValue?: number;
  className?: string;
  placeholder?: string;
}

/**
 * Number input backed by string state so users can clear the field
 * (instead of being stuck with a leading "0").
 */
export function NumberInput({
  value,
  onChange,
  min,
  max,
  emptyValue = 0,
  className,
  placeholder,
}: NumberInputProps) {
  const [text, setText] = useState(String(value));

  // Sync external value changes (e.g. reset/sample load)
  useEffect(() => {
    setText((cur) => (Number(cur) === value ? cur : String(value)));
  }, [value]);

  return (
    <Input
      type="text"
      inputMode="numeric"
      value={text}
      placeholder={placeholder}
      className={cn(className)}
      onChange={(e) => {
        const v = e.target.value;
        if (v === "" || /^-?\d*\.?\d*$/.test(v)) {
          setText(v);
          if (v === "" || v === "-" || v === ".") {
            onChange(emptyValue);
          } else {
            let n = Number(v);
            if (!Number.isFinite(n)) return;
            if (min !== undefined) n = Math.max(min, n);
            if (max !== undefined) n = Math.min(max, n);
            onChange(n);
          }
        }
      }}
      onBlur={() => {
        if (text === "" || text === "-" || text === ".") {
          setText(String(emptyValue));
        } else {
          setText(String(value));
        }
      }}
    />
  );
}
