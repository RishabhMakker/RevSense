"use client";

import { useCallback, useEffect, useState } from "react";
import { getGarageRepository } from "./localRepository";
import type { SavedVehicle } from "./types";

export interface UseGarage {
  vehicles: SavedVehicle[];
  /** False until the first read resolves — lets callers avoid a flash of "empty". */
  loaded: boolean;
  refresh: () => Promise<void>;
  saveVehicle: (
    v: Omit<SavedVehicle, "id" | "createdAt">
  ) => Promise<SavedVehicle>;
  updateVehicle: (id: string, patch: Partial<SavedVehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  eraseAll: () => Promise<void>;
  exportAll: () => Promise<string>;
}

/**
 * Reactive wrapper over the {@link GarageRepository} singleton. Mutations
 * refresh the in-memory list so any screen using the hook stays in sync.
 */
export function useGarage(): UseGarage {
  const [vehicles, setVehicles] = useState<SavedVehicle[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const list = await getGarageRepository().listVehicles();
    setVehicles(list);
    setLoaded(true);
  }, []);

  // Client-only initial load. Reading in a `.then` (rather than awaiting inside
  // the effect) keeps state updates off the synchronous effect path and avoids
  // an SSR hydration mismatch — the first render is always the empty garage.
  useEffect(() => {
    let active = true;
    void getGarageRepository()
      .listVehicles()
      .then((list) => {
        if (!active) return;
        setVehicles(list);
        setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const saveVehicle = useCallback(
    async (v: Omit<SavedVehicle, "id" | "createdAt">) => {
      const saved = await getGarageRepository().saveVehicle(v);
      await refresh();
      return saved;
    },
    [refresh]
  );

  const updateVehicle = useCallback(
    async (id: string, patch: Partial<SavedVehicle>) => {
      await getGarageRepository().updateVehicle(id, patch);
      await refresh();
    },
    [refresh]
  );

  const deleteVehicle = useCallback(
    async (id: string) => {
      await getGarageRepository().deleteVehicle(id);
      await refresh();
    },
    [refresh]
  );

  const eraseAll = useCallback(async () => {
    await getGarageRepository().eraseAll();
    await refresh();
  }, [refresh]);

  const exportAll = useCallback(() => getGarageRepository().exportAll(), []);

  return {
    vehicles,
    loaded,
    refresh,
    saveVehicle,
    updateVehicle,
    deleteVehicle,
    eraseAll,
    exportAll,
  };
}
