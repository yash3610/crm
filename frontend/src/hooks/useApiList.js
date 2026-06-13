import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { api } from "@/lib/api";

export function useApiList(endpoint, fallback = [], options = {}) {
  const paginated = Boolean(options.paginated);
  const initialPageSize = options.pageSize || 8;
  const [rows, setRows] = useState(fallback);
  const [allRows, setAllRows] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: initialPageSize,
    total: fallback.length,
    pages: 1,
    hasPrevious: false,
    hasNext: false,
  });

  const queryString = useMemo(() => {
    if (!paginated) return "";
    const params = new URLSearchParams({
      page: String(page),
      limit: String(pageSize),
    });
    if (search.trim()) params.set("search", search.trim());
    Object.entries(filters).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        value !== "all"
      ) {
        params.set(key, String(value));
      }
    });
    return params.toString();
  }, [filters, page, pageSize, paginated, search]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      if (!paginated) {
        const data = await api.get(endpoint);
        setRows(data);
        setAllRows(data);
        return;
      }

      const [pageData, completeData] = await Promise.all([
        api.get(`${endpoint}?${queryString}`),
        api.get(endpoint),
      ]);
      setRows(pageData.items || []);
      setPagination(pageData.pagination);
      setPage(pageData.pagination.page);
      setAllRows(Array.isArray(completeData) ? completeData : []);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint, paginated, queryString]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (payload) => {
    const item = await api.post(endpoint, payload);
    if (paginated) {
      await load();
    } else {
      setRows((current) => [item, ...current]);
      setAllRows((current) => [item, ...current]);
    }
    return item;
  };

  const update = async (id, payload) => {
    const item = await api.put(`${endpoint}/${id}`, payload);
    setRows((current) => current.map((row) => (row.id === id ? item : row)));
    setAllRows((current) => current.map((row) => (row.id === id ? item : row)));
    return item;
  };

  const remove = async (id) => {
    await api.delete(`${endpoint}/${id}`);
    if (paginated) {
      await load();
    } else {
      setRows((current) => current.filter((row) => row.id !== id));
      setAllRows((current) => current.filter((row) => row.id !== id));
    }
  };

  const changePageSize = useCallback((value) => {
    setPageSize(value);
    setPage(1);
  }, []);
  const changeSearch = useCallback((value) => {
    setSearch(value);
    setPage(1);
  }, []);
  const changeFilters = useCallback((next) => {
    setFilters((current) => ({ ...current, ...next }));
    setPage(1);
  }, []);

  return {
    rows,
    allRows,
    setRows,
    setAllRows,
    loading,
    reload: load,
    create,
    update,
    remove,
    pagination,
    page,
    pageSize,
    search,
    filters,
    setPage,
    setPageSize: changePageSize,
    setSearch: changeSearch,
    setFilters: changeFilters,
  };
}
