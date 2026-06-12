import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { api } from "@/lib/api";

export function useApiList(endpoint, fallback = []) {
  const [rows, setRows] = useState(fallback);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setRows(await api.get(endpoint));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (payload) => {
    const item = await api.post(endpoint, payload);
    setRows((current) => [item, ...current]);
    return item;
  };

  const update = async (id, payload) => {
    const item = await api.put(`${endpoint}/${id}`, payload);
    setRows((current) => current.map((row) => (row.id === id ? item : row)));
    return item;
  };

  const remove = async (id) => {
    await api.delete(`${endpoint}/${id}`);
    setRows((current) => current.filter((row) => row.id !== id));
  };

  return { rows, setRows, loading, reload: load, create, update, remove };
}
