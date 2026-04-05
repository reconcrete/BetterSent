import { useState, useEffect } from "react";

const STORAGE_KEY = "bettersent:activeTab";
const DEFAULT_TAB = "file";

export const usePersistedTab = () => {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem(STORAGE_KEY) || DEFAULT_TAB);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, activeTab);
  }, [activeTab]);

  return [activeTab, setActiveTab] as const;
};
