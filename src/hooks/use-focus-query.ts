import { useFocusEffect } from 'expo-router';
import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Runs `loader` every time the screen gains focus, and again on `reload()`.
 * Pass a `key` (route param, filter, …) to re-run when it changes.
 */
export function useFocusQuery<T>(
  loader: (db: SQLiteDatabase, key: string | number) => Promise<T>,
  key: string | number = '',
) {
  const db = useSQLiteContext();
  const loaderRef = useRef(loader);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loaderRef.current = loader;
  });

  const reload = useCallback(async () => {
    setData(await loaderRef.current(db, key));
    setLoading(false);
  }, [db, key]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      loaderRef.current(db, key).then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      });
      return () => {
        cancelled = true;
      };
    }, [db, key]),
  );

  return { data, loading, reload };
}
