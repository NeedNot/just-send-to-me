import { useState } from 'react';

export function useCooldown(cooldownTime: number) {
  const [timeLeft, setTimeLeft] = useState(0);

  const startCooldown = () => {
    setTimeLeft(cooldownTime / 1000);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return { timeLeft, startCooldown };
}
