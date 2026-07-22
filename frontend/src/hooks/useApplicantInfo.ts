import { useCallback, useEffect, useState } from "react";
import {
  EMPTY_APPLICANT,
  type ApplicantInfo,
} from "../../../lib/schemas/applicant.js";
import {
  extractApplicantFromResume,
  fetchStoredApplicant,
} from "../api/applicant.js";

export function useApplicantInfo() {
  const [applicant, setApplicant] = useState<ApplicantInfo>(EMPTY_APPLICANT);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refreshApplicant = useCallback(async () => {
    const info = await fetchStoredApplicant();
    setApplicant(info);
    return info;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadApplicant() {
      try {
        const info = await fetchStoredApplicant();
        if (!cancelled) {
          setApplicant(info);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Failed to load contact info",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoaded(true);
        }
      }
    }

    void loadApplicant();

    return () => {
      cancelled = true;
    };
  }, []);

  const syncApplicantFromResume = useCallback(async (rawResumeText: string) => {
    const info = await extractApplicantFromResume(rawResumeText);
    setApplicant(info);
    return info;
  }, []);

  return {
    applicant,
    isLoaded,
    loadError,
    refreshApplicant,
    syncApplicantFromResume,
  };
}
