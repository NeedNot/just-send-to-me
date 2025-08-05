import { useEffect, useState } from 'react';
import { MS_IN_DAY, MS_IN_HOUR } from '@shared/constants';

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

function formatTime(msLeft: number) {
  const totalSeconds = Math.floor(msLeft / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);

  if (days >= 1) {
    return days === 1 ? '1 day' : `${days} days`;
  }

  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;
  const seconds = totalSeconds % 60;

  if (totalHours >= 1) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  } else {
    return `${pad(minutes)}:${pad(seconds)}`;
  }
}

function pad(num: number): string {
  return num.toString().padStart(2, '0');
}
