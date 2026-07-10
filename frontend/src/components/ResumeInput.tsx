import { useEffect, useRef, useState } from "react";
import {
  extractResumeText,
  isSupportedResumeFile,
  SUPPORTED_RESUME_FORMATS,
} from "../utils/resumeFileParser";
import { stripContactInfo } from "../utils/stripContactInfo";

export type ResumeSource = "paste" | "upload" | "stored";

type ResumeInputProps = {
  source: ResumeSource;
  onSourceChange: (source: ResumeSource) => void;
  pastedResume: string;
  onPastedResumeChange: (value: string) => void;
  storedResume: string;
  hasStoredResume: boolean;
  onSaveStoredResume: (text: string) => Promise<string>;
  onClearStoredResume: () => Promise<void>;
  disabled?: boolean;
};

export function ResumeInput({
  source,
  onSourceChange,
  pastedResume,
  onPastedResumeChange,
  storedResume,
  hasStoredResume,
  onSaveStoredResume,
  onClearStoredResume,
  disabled = false,
}: ResumeInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [storedDraft, setStoredDraft] = useState(storedResume);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isEditExpanded, setIsEditExpanded] = useState(false);

  useEffect(() => {
    setStoredDraft(storedResume);
  }, [storedResume]);

  useEffect(() => {
    setIsEditExpanded(!hasStoredResume);
  }, [hasStoredResume]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    if (!isSupportedResumeFile(file)) {
      setUploadError(`Please upload a ${SUPPORTED_RESUME_FORMATS} file.`);
      return;
    }

    try {
      const text = await extractResumeText(file);
      onPastedResumeChange(text);
      setUploadedFileName(file.name);
      onSourceChange("paste");
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Failed to read resume file"
      );
    } finally {
      event.target.value = "";
    }
  }

  async function handleSaveStoredResume() {
    if (!storedDraft.trim()) {
      setSaveMessage("Add resume text before saving.");
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const sanitized = await onSaveStoredResume(storedDraft);
      setStoredDraft(sanitized);
      setIsEditExpanded(false);
      setSaveMessage("Saved to data/resume.txt. Contact information was removed.");
    } catch (error) {
      setSaveMessage(
        error instanceof Error ? error.message : "Failed to save resume."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleClearStoredResume() {
    setIsClearing(true);
    setSaveMessage(null);

    try {
      await onClearStoredResume();
      setStoredDraft("");
      setSaveMessage("Saved resume cleared.");
    } catch (error) {
      setSaveMessage(
        error instanceof Error ? error.message : "Failed to clear saved resume."
      );
    } finally {
      setIsClearing(false);
    }
  }

  const tabs: { id: ResumeSource; label: string }[] = [
    { id: "paste", label: "Paste" },
    { id: "upload", label: "Upload" },
    { id: "stored", label: "My Resume" },
  ];

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-gray-900">Resume</h2>
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              disabled={disabled}
              onClick={() => onSourceChange(tab.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                source === tab.id
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {source === "paste" && (
        <div className="space-y-2">
          <textarea
            value={pastedResume}
            onChange={(event) => onPastedResumeChange(event.target.value)}
            disabled={disabled}
            rows={12}
            placeholder="Paste your resume text here..."
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-gray-100"
          />
          {uploadedFileName && (
            <p className="text-xs text-gray-500">
              Loaded from file: {uploadedFileName}
            </p>
          )}
        </div>
      )}

      {source === "upload" && (
        <div className="space-y-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-600">
            Upload a resume file ({SUPPORTED_RESUME_FORMATS})
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.docx,.pdf,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            disabled={disabled}
            onChange={handleFileChange}
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200 hover:bg-indigo-50 disabled:opacity-50"
          >
            Choose file
          </button>
          {uploadError && (
            <p className="text-sm text-red-600" role="alert">
              {uploadError}
            </p>
          )}
        </div>
      )}

      {source === "stored" && (
        <div className="space-y-3">
          {hasStoredResume ? (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">
                Using your saved resume from data/resume.txt (contact info
                removed).
              </p>
              <pre className="max-h-64 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs whitespace-pre-wrap text-gray-700">
                {storedResume}
              </pre>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={disabled || isClearing}
                  onClick={() => void handleClearStoredResume()}
                  className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {isClearing ? "Clearing..." : "Clear saved resume"}
                </button>
                {!isEditExpanded && (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setIsEditExpanded(true);
                      setSaveMessage(null);
                    }}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Update resume
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              No saved resume yet. Paste yours below and save it for next time.
            </p>
          )}

          {(!hasStoredResume || isEditExpanded) && (
            <div className="space-y-3">
              <textarea
                value={storedDraft}
                onChange={(event) => {
                  setStoredDraft(event.target.value);
                  setSaveMessage(null);
                }}
                disabled={disabled}
                rows={10}
                placeholder="Paste your resume here to save it to data/resume.txt. Contact details will be removed when you save."
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-gray-100"
              />

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={disabled || isSaving}
                  onClick={() => void handleSaveStoredResume()}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save resume"}
                </button>
                {storedDraft.trim() && (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      const sanitized = stripContactInfo(storedDraft);
                      setStoredDraft(sanitized);
                      setSaveMessage(
                        "Preview updated with contact info removed."
                      );
                    }}
                    className="rounded-lg border border-indigo-200 bg-white px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
                  >
                    Preview without contact info
                  </button>
                )}
                {hasStoredResume && (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setIsEditExpanded(false);
                      setStoredDraft(storedResume);
                      setSaveMessage(null);
                    }}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {saveMessage && (
                <p
                  className={`text-sm ${
                    saveMessage.startsWith("Failed") ||
                    saveMessage.startsWith("Add resume")
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}
                  role="status"
                >
                  {saveMessage}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
