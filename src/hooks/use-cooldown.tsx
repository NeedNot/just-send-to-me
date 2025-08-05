import { useState } from 'react';

export function useCooldown(cooldownTime: number) {
  const [cooldown, setCooldown] = useState(false);

  const startCooldown = () => {
    setCooldown(true);
    setTimeout(() => setCooldown(false), cooldownTime);
  };

  return { cooldown, startCooldown };
}
