import { useMemo, useState } from "react";
import {
  isApplicantComplete,
  type ApplicantInfo,
} from "../../../lib/schemas/applicant.js";
import type { CoverLetterResponse } from "../../../lib/schemas/coverLetter.js";
import { formatCoverLetterDocument } from "../../../lib/utils/formatCoverLetterDocument.js";
import { generateCoverLetter } from "../api/coverLetter.js";
import {
  buildCoverLetterDocx,
  buildCoverLetterFilename,
  downloadCoverLetterDocx,
} from "../utils/buildCoverLetterDocx.js";
import {
  buildCoverLetterPdf,
  buildCoverLetterPdfFilename,
  downloadCoverLetterPdf,
} from "../utils/buildCoverLetterPdf.js";
import { stripContactInfo } from "../utils/stripContactInfo.js";
import { CoverLetterResult } from "./CoverLetterResult.js";
import { JobDescriptionInput } from "./JobDescriptionInput.js";
import { ResumeInput, type ResumeSource } from "./ResumeInput.js";

export type CoverLetterPanelProps = {
  jobDescription: string;
  onJobDescriptionChange: (value: string) => void;
  resumeSource: ResumeSource;
  onResumeSourceChange: (source: ResumeSource) => void;
  pastedResume: string;
  onPastedResumeChange: (value: string) => void;
  uploadedResume: string;
  onUploadedResumeChange: (value: string) => void;
  storedResume: string;
  hasStoredResume: boolean;
  onSaveStoredResume: (text: string) => Promise<string>;
  onClearStoredResume: () => Promise<void>;
  resumeLoadError: string | null;
  applicantLoadError: string | null;
  applicant: ApplicantInfo;
  refreshApplicant: () => Promise<ApplicantInfo>;
  syncApplicantFromResume: (resumeText: string) => Promise<ApplicantInfo>;
};

export function CoverLetterPanel({
  jobDescription,
  onJobDescriptionChange,
  resumeSource,
  onResumeSourceChange,
  pastedResume,
  onPastedResumeChange,
  uploadedResume,
  onUploadedResumeChange,
  storedResume,
  hasStoredResume,
  onSaveStoredResume,
  onClearStoredResume,
  resumeLoadError,
  applicantLoadError,
  applicant,
  refreshApplicant,
  syncApplicantFromResume,
}: CoverLetterPanelProps) {
  const [generatedLetter, setGeneratedLetter] =
    useState<CoverLetterResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const [docxDownloadStatus, setDocxDownloadStatus] = useState<
    "idle" | "downloading" | "error"
  >("idle");
  const [pdfDownloadStatus, setPdfDownloadStatus] = useState<
    "idle" | "downloading" | "error"
  >("idle");

  const activeResumeText = useMemo(() => {
    if (resumeSource === "stored") {
      return storedResume;
    }
    if (resumeSource === "upload") {
      return uploadedResume;
    }
    return pastedResume;
  }, [resumeSource, storedResume, uploadedResume, pastedResume]);

  const formattedCoverLetter = useMemo(() => {
    if (!generatedLetter) {
      return null;
    }

    return formatCoverLetterDocument({
      applicant,
      body: generatedLetter.coverLetter,
      companyName: generatedLetter.companyName,
    });
  }, [applicant, generatedLetter]);

  const hasCompleteApplicant = isApplicantComplete(applicant);

  async function handleGenerate() {
    setError(null);
    setGeneratedLetter(null);
    setCopyStatus("idle");
    setDocxDownloadStatus("idle");
    setPdfDownloadStatus("idle");

    if (!jobDescription.trim()) {
      setError("Please paste a job description.");
      return;
    }

    if (!activeResumeText.trim()) {
      setError(
        resumeSource === "stored"
          ? "Save a resume under My Resume first, or switch to Paste/Upload."
          : resumeSource === "upload"
            ? "Please upload a resume file."
            : "Please provide your resume.",
      );
      return;
    }

    setIsGenerating(true);

    try {
      if (resumeSource === "paste") {
        await syncApplicantFromResume(pastedResume);
      } else if (resumeSource === "upload") {
        await syncApplicantFromResume(uploadedResume);
      } else {
        await refreshApplicant();
      }

      const resumeText =
        resumeSource === "stored"
          ? storedResume
          : stripContactInfo(
              resumeSource === "upload" ? uploadedResume : pastedResume,
            );

      const result = await generateCoverLetter({
        jobDescription: jobDescription.trim(),
        resumeText,
      });

      setGeneratedLetter(result);
    } catch (generateError) {
      setError(
        generateError instanceof Error
          ? generateError.message
          : "Something went wrong.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleDownloadDocx() {
    if (!generatedLetter) return;

    setDocxDownloadStatus("downloading");

    try {
      const blob = await buildCoverLetterDocx({
        applicant,
        body: generatedLetter.coverLetter,
        companyName: generatedLetter.companyName,
      });
      downloadCoverLetterDocx(
        blob,
        buildCoverLetterFilename(generatedLetter.companyName),
      );
      setDocxDownloadStatus("idle");
    } catch {
      setDocxDownloadStatus("error");
    }
  }

  async function handleDownloadPdf() {
    if (!generatedLetter) return;

    setPdfDownloadStatus("downloading");

    try {
      const blob = await buildCoverLetterPdf({
        applicant,
        body: generatedLetter.coverLetter,
        companyName: generatedLetter.companyName,
      });
      downloadCoverLetterPdf(
        blob,
        buildCoverLetterPdfFilename(generatedLetter.companyName),
      );
      setPdfDownloadStatus("idle");
    } catch {
      setPdfDownloadStatus("error");
    }
  }

  async function handleCopy() {
    if (!formattedCoverLetter) return;

    try {
      await navigator.clipboard.writeText(formattedCoverLetter);
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus("idle"), 2000);
    } catch {
      setCopyStatus("error");
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <JobDescriptionInput
          value={jobDescription}
          onChange={onJobDescriptionChange}
          disabled={isGenerating}
        />

        <ResumeInput
          source={resumeSource}
          onSourceChange={onResumeSourceChange}
          pastedResume={pastedResume}
          onPastedResumeChange={onPastedResumeChange}
          uploadedResume={uploadedResume}
          onUploadedResumeChange={onUploadedResumeChange}
          storedResume={storedResume}
          hasStoredResume={hasStoredResume}
          onSaveStoredResume={onSaveStoredResume}
          onClearStoredResume={onClearStoredResume}
          disabled={isGenerating}
        />

        {(resumeLoadError || applicantLoadError) && (
          <p className="text-sm text-red-600" role="alert">
            {resumeLoadError ?? applicantLoadError}
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
        {formattedCoverLetter ? (
          <CoverLetterResult
            coverLetter={formattedCoverLetter}
            onCopy={handleCopy}
            copyStatus={copyStatus}
            onDownloadDocx={handleDownloadDocx}
            docxDownloadStatus={docxDownloadStatus}
            onDownloadPdf={handleDownloadPdf}
            pdfDownloadStatus={pdfDownloadStatus}
            hasCompleteApplicant={hasCompleteApplicant}
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
  );
}
