import { useEffect, useState } from 'react';
import { MS_IN_DAY, MS_IN_HOUR } from '@shared/constants';
import { formatTime } from '@/lib/utils';

export function useCountdown(targetDate: Date) {
  const [display, setDisplay] = useState(() =>
    formatTime(targetDate.getTime() - Date.now()),
  );
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    setIsDone(false);
    const update = () => {
      const now = Date.now();
      const msLeft = targetDate.getTime() - now;
      setDisplay(formatTime(msLeft));

      if (msLeft <= 0) {
        setIsDone(true);
        return;
      }

      if (msLeft > MS_IN_DAY) {
        timeout = setTimeout(update, MS_IN_HOUR);
      } else {
        timeout = setTimeout(update, 1000);
      }
    };

    update();

    return () => clearTimeout(timeout);
  }, [targetDate]);

  return { display, isDone };
}
