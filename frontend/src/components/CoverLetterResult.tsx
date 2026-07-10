type DownloadStatus = "idle" | "downloading" | "error";

type CoverLetterResultProps = {
  coverLetter: string;
  onCopy: () => void;
  copyStatus: "idle" | "copied" | "error";
  onDownloadDocx: () => void;
  downloadStatus: DownloadStatus;
  hasCompleteApplicant: boolean;
};

export function CoverLetterResult({
  coverLetter,
  onCopy,
  copyStatus,
  onDownloadDocx,
  downloadStatus,
  hasCompleteApplicant,
}: CoverLetterResultProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-gray-900">Generated Cover Letter</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDownloadDocx}
            disabled={downloadStatus === "downloading"}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {downloadStatus === "downloading" ? "Downloading..." : "Download .docx"}
          </button>
          <button
            type="button"
            onClick={onCopy}
            className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200 hover:bg-indigo-50"
          >
            {copyStatus === "copied" ? "Copied!" : "Copy for Word"}
          </button>
        </div>
      </div>

      {!hasCompleteApplicant && (
        <p className="text-sm text-amber-700" role="status">
          Some contact details could not be extracted from your resume. Re-save
          a resume with your name, location, email, and phone in the header.
        </p>
      )}

      {copyStatus === "error" && (
        <p className="text-sm text-red-600" role="alert">
          Could not copy to clipboard. Please select and copy manually.
        </p>
      )}

      {downloadStatus === "error" && (
        <p className="text-sm text-red-600" role="alert">
          Could not create the Word document. Please try again.
        </p>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
          {coverLetter}
        </p>
      </div>
    </section>
  );
}
