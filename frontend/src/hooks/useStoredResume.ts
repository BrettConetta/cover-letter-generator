import { useCallback, useEffect, useState } from "react";
import {
  clearStoredResume,
  fetchStoredResume,
  saveStoredResume as persistStoredResume,
} from "../api/resume";

const LEGACY_STORAGE_KEY = "cover-letter-generator:stored-resume";

export function useStoredResume() {
  const [storedResume, setStoredResumeState] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadResume() {
      try {
        let text = await fetchStoredResume();

        const legacyResume = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (!text.trim() && legacyResume?.trim()) {
          text = await persistStoredResume(legacyResume);
          localStorage.removeItem(LEGACY_STORAGE_KEY);
        }

        if (!cancelled) {
          setStoredResumeState(text);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Failed to load saved resume"
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoaded(true);
        }
      }
    }

    void loadResume();

    return () => {
      cancelled = true;
    };
  }, []);

  const saveResume = useCallback(async (rawText: string) => {
    const sanitized = await persistStoredResume(rawText);
    setStoredResumeState(sanitized);
    return sanitized;
  }, []);

  const clearResume = useCallback(async () => {
    await clearStoredResume();
    setStoredResumeState("");
  }, []);

  return {
    storedResume,
    hasStoredResume: storedResume.length > 0,
    isLoaded,
    loadError,
    saveResume,
    clearResume,
  };
}
