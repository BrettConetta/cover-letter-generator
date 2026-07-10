type JobDescriptionInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function JobDescriptionInput({
  value,
  onChange,
  disabled = false,
}: JobDescriptionInputProps) {
  return (
    <section className="space-y-2">
      <label htmlFor="job-description" className="block text-sm font-medium text-gray-900">
        Job Description
      </label>
      <textarea
        id="job-description"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        rows={12}
        placeholder="Paste the full job description here..."
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-gray-100"
      />
    </section>
  );
}
