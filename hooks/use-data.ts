import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const useData = <T>(collectionName: string, activeOnly = true) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let q = query(collection(db, collectionName));

    if (activeOnly) {
      q = query(q, where('status', '==', 'ativo'));
    }

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
        setData(items);
        setLoading(false);
      },
      (err) => {
        setError(`Erro ao buscar dados: ${err.message}`);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, activeOnly]);

  return { data, loading, error };
};
