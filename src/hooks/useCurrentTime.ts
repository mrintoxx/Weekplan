import { useState, useEffect } from 'react';

export function useCurrentTime(): Date {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => {
      clearInterval(id);
    };
  }, []);

  return now;
}
