import { useState } from "react";
import { CoverLetterPanel } from "./components/CoverLetterPanel.js";
import type { ResumeSource } from "./components/ResumeInput.js";
import { ResumeTailorPanel } from "./components/ResumeTailorPanel.js";
import { useApplicantInfo } from "./hooks/useApplicantInfo.js";
import { useStoredResume } from "./hooks/useStoredResume.js";

type AppTab = "resume-tailor" | "cover-letter";

function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("resume-tailor");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeSource, setResumeSource] = useState<ResumeSource>("paste");
  const [pastedResume, setPastedResume] = useState("");
  const [uploadedResume, setUploadedResume] = useState("");

  const {
    storedResume,
    hasStoredResume,
    isLoaded: isResumeLoaded,
    loadError: resumeLoadError,
    saveResume,
    clearResume,
  } = useStoredResume();

  const {
    applicant,
    isLoaded: isApplicantLoaded,
    loadError: applicantLoadError,
    refreshApplicant,
    syncApplicantFromResume,
  } = useApplicantInfo();

  async function handleResumeSaved(rawText: string) {
    const sanitized = await saveResume(rawText);
    await refreshApplicant();
    return sanitized;
  }

  async function handleResumeCleared() {
    await clearResume();
    await refreshApplicant();
  }

  if (!isResumeLoaded || !isApplicantLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-sm text-gray-600">
        Loading...
      </div>
    );
  }

  const sharedInputProps = {
    jobDescription,
    onJobDescriptionChange: setJobDescription,
    resumeSource,
    onResumeSourceChange: setResumeSource,
    pastedResume,
    onPastedResumeChange: setPastedResume,
    uploadedResume,
    onUploadedResumeChange: setUploadedResume,
    storedResume,
    hasStoredResume,
    onSaveStoredResume: handleResumeSaved,
    onClearStoredResume: handleResumeCleared,
    resumeLoadError,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div
          className={`mx-auto px-4 py-6 sm:px-6 ${
            activeTab === "resume-tailor" ? "max-w-7xl" : "max-w-6xl"
          }`}
        >
          <h1 className="text-2xl font-bold text-gray-900">
            Job Application Assistant
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Generate cover letters and tailor your resume for each role.
          </p>

          <div
            className="mt-5 flex gap-1 border-b border-gray-200"
            role="tablist"
            aria-label="Application tools"
          >
            <TabButton
              id="resume-tailor"
              label="Resume Tailor"
              active={activeTab === "resume-tailor"}
              onSelect={setActiveTab}
            />
            <TabButton
              id="cover-letter"
              label="Cover Letter"
              active={activeTab === "cover-letter"}
              onSelect={setActiveTab}
            />
          </div>
        </div>
      </header>

      <main
        className={`mx-auto px-4 py-8 sm:px-6 ${
          activeTab === "resume-tailor" ? "max-w-7xl" : "max-w-6xl"
        }`}
      >
        {activeTab === "cover-letter" ? (
          <CoverLetterPanel
            {...sharedInputProps}
            applicantLoadError={applicantLoadError}
            applicant={applicant}
            refreshApplicant={refreshApplicant}
            syncApplicantFromResume={syncApplicantFromResume}
          />
        ) : (
          <ResumeTailorPanel {...sharedInputProps} />
        )}
      </main>
    </div>
  );
}

function TabButton({
  id,
  label,
  active,
  onSelect,
}: {
  id: AppTab;
  label: string;
  active: boolean;
  onSelect: (tab: AppTab) => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      id={`tab-${id}`}
      aria-selected={active}
      aria-controls={`panel-${id}`}
      onClick={() => onSelect(id)}
      className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-indigo-600 text-indigo-700"
          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
      }`}
    >
      {label}
    </button>
  );
}

export default App;
