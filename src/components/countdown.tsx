import { useEffect, useState, type HTMLAttributes } from 'react';

type CountdownProps = HTMLAttributes<HTMLDivElement> & {
  prefix?: string;
  targetDate: Date;
};

export function Countdown({ targetDate, prefix, ...props }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const difference = new Date(targetDate).getTime() - now.getTime();

      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft('00:00');
      } else {
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / (1000 * 60)) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        const pad = (num: number) => String(num).padStart(2, '0');

        if (hours > 0) {
          setTimeLeft(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
        } else {
          setTimeLeft(`${pad(minutes)}:${pad(seconds)}`);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <span {...props}>
      {prefix} {timeLeft}
    </span>
  );
}
