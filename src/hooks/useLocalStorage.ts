import { useState } from "react";

export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
    setState((prev) => {
      const next = typeof value === "function" ? (value as (p: T) => T)(prev) : value;
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  };

  return [state, setValue];
}
