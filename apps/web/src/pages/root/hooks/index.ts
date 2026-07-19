import { useState, useEffect } from "react";

const STORAGE_KEY = "bettersent:activeTab";
const DEFAULT_TAB = "file";
const VALID_TABS = ["file", "url", "text", "youtube"];

export const usePersistedTab = () => {
  const [activeTab, setActiveTab] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && VALID_TABS.includes(stored) ? stored : DEFAULT_TAB;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, activeTab);
  }, [activeTab]);

  return [activeTab, setActiveTab] as const;
};
