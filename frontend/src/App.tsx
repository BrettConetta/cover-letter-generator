import { useMemo, useState } from "react";
import { generateCoverLetter } from "./api/coverLetter";
import { CoverLetterResult } from "./components/CoverLetterResult";
import { JobDescriptionInput } from "./components/JobDescriptionInput";
import { ResumeInput, type ResumeSource } from "./components/ResumeInput";
import { useStoredResume } from "./hooks/useStoredResume";
import { stripContactInfo } from "./utils/stripContactInfo";

function App() {
  const [jobDescription, setJobDescription] = useState("");
  const [resumeSource, setResumeSource] = useState<ResumeSource>("paste");
  const [pastedResume, setPastedResume] = useState("");
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
    "idle"
  );

  const {
    storedResume,
    hasStoredResume,
    isLoaded,
    loadError,
    saveResume,
    clearResume,
  } = useStoredResume();

  const activeResumeText = useMemo(() => {
    if (resumeSource === "stored") {
      return storedResume;
    }
    return pastedResume;
  }, [resumeSource, storedResume, pastedResume]);

  async function handleGenerate() {
    setError(null);
    setCoverLetter(null);
    setCopyStatus("idle");

    if (!jobDescription.trim()) {
      setError("Please paste a job description.");
      return;
    }

    if (!activeResumeText.trim()) {
      setError(
        resumeSource === "stored"
          ? "Save a resume under My Resume first, or switch to Paste/Upload."
          : "Please provide your resume."
      );
      return;
    }

    setIsGenerating(true);

    try {
      const resumeText =
        resumeSource === "stored"
          ? storedResume
          : stripContactInfo(pastedResume);

      const result = await generateCoverLetter({
        jobDescription: jobDescription.trim(),
        resumeText,
      });

      setCoverLetter(result.coverLetter);
    } catch (generateError) {
      setError(
        generateError instanceof Error
          ? generateError.message
          : "Something went wrong."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCopy() {
    if (!coverLetter) return;

    try {
      await navigator.clipboard.writeText(coverLetter);
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus("idle"), 2000);
    } catch {
      setCopyStatus("error");
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-sm text-gray-600">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Cover Letter Generator
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Paste a job description and your resume to generate a tailored cover
            letter.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <JobDescriptionInput
              value={jobDescription}
              onChange={setJobDescription}
              disabled={isGenerating}
            />

            <ResumeInput
              source={resumeSource}
              onSourceChange={setResumeSource}
              pastedResume={pastedResume}
              onPastedResumeChange={setPastedResume}
              storedResume={storedResume}
              hasStoredResume={hasStoredResume}
              onSaveStoredResume={saveResume}
              onClearStoredResume={clearResume}
              disabled={isGenerating}
            />

            {loadError && (
              <p className="text-sm text-red-600" role="alert">
                {loadError}
              </p>
            )}

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGenerating ? "Generating..." : "Generate cover letter"}
              </button>

              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            {coverLetter ? (
              <CoverLetterResult
                coverLetter={coverLetter}
                onCopy={handleCopy}
                copyStatus={copyStatus}
              />
            ) : (
              <div className="flex h-full min-h-80 items-center justify-center text-center">
                <p className="max-w-sm text-sm text-gray-500">
                  Your generated cover letter will appear here. Add a job
                  description and resume, then click Generate.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
