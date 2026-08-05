import { useEffect, useState } from "react";

/**
 * Simulates a brief data-fetch delay so list/table screens show a skeleton
 * instead of popping in instantly (spec 8: "skeleton screens, no solo spinners").
 */
export function useMockLoading(delayMs = 500): boolean {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), delayMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return loading;
}
