let idCounter = 1000;

export function generateId(prefix: string): string {
  idCounter += 1;
  const year = new Date().getFullYear() || 2024;
  return `${prefix}-${year}-${String(idCounter).padStart(4, "0")}`;
}

export function sleep(ms = 700): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface SimulateStep {
  label: string;
  duration?: number;
}

/**
 * Runs a sequence of labeled steps with delays, invoking onStep after each
 * one completes. Used to fake OCR/OFAC/e-signature/SSO style async flows.
 */
export async function simulateProcess(steps: SimulateStep[], onStep?: (label: string, index: number) => void): Promise<void> {
  for (let i = 0; i < steps.length; i++) {
    await sleep(steps[i].duration ?? 600);
    onStep?.(steps[i].label, i);
  }
}
