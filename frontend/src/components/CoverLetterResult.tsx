type CoverLetterResultProps = {
  coverLetter: string;
  onCopy: () => void;
  copyStatus: "idle" | "copied" | "error";
};

export function CoverLetterResult({
  coverLetter,
  onCopy,
  copyStatus,
}: CoverLetterResultProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-gray-900">Generated Cover Letter</h2>
        <button
          type="button"
          onClick={onCopy}
          className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200 hover:bg-indigo-50"
        >
          {copyStatus === "copied" ? "Copied!" : "Copy to clipboard"}
        </button>
      </div>

      {copyStatus === "error" && (
        <p className="text-sm text-red-600" role="alert">
          Could not copy to clipboard. Please select and copy manually.
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
