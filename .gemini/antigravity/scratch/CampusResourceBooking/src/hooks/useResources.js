import { useCallback, useEffect, useState } from 'react';
import { fetchResources } from '../services/resourceService';

export function useResources({ includeInactive = true } = {}) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchResources({ includeInactive });
      setResources(data);
    } catch (err) {
      setError(err.message || 'Failed to load campus resources.');
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    load();
  }, [load]);

  return { resources, loading, error, reload: load };
}
