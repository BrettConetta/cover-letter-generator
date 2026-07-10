# Cover Letter Generator

A full-stack TypeScript app that generates tailored cover letters from a job description and your resume. It uses the Anthropic Claude API to write the letter body, then assembles a complete, ready-to-send document with your contact header, date, recipient block, and sign-off.

Paste or upload a resume, add a job posting, and get a cover letter you can copy into Word or download as `.docx` or PDF.

## Features

- **Tailored generation** — Claude analyzes the job description and resume to write a focused, human-sounding cover letter grounded in your actual experience.
- **Multiple resume inputs** — Paste text, upload a file (TXT, MD, DOCX, or PDF), or save a resume under **My Resume** for reuse.
- **Automatic contact header** — Name, location, email, and phone are parsed from your resume header and added to the formatted output.
- **Privacy for stored resumes** — When you save a resume, contact details are stripped from the stored copy (`data/resume.txt`); only the extracted contact fields are kept separately (`data/applicant.json`).
- **Export options** — Copy the full formatted letter, download a Word document (Calibri 11pt, 1" margins), or download a PDF (Helvetica 11pt, 1" margins).

## Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

## Setup

1. Clone the repository and install dependencies:

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

2. Create a `.env` file in the project root (see `.env.example`):

```bash
cp .env.example .env
```

3. Add your API key and optionally override the model:

```
ANTHROPIC_API_KEY=your_anthropic_api_key
ANTHROPIC_MODEL=claude-sonnet-4-6
```

## Development

### Start everything

From the project directory:

```bash
npm run dev
```

### Global command (optional)

Run this once from the project root to register a global command:

```bash
npm link
```

Then start the app from any directory:

```bash
cover-letter-generator
```

To remove the global command later, run `npm unlink -g cover-letter-generator` from the project root.

This starts:

- Backend API at http://localhost:3001
- Frontend UI at http://localhost:5173 (proxies `/api` requests to the backend)

### Start apps individually

**Backend:**

```bash
cd backend
npm run dev
```

**Frontend:**

```bash
cd frontend
npm run dev
```

### Build

```bash
npm run build          # frontend production build
npm run build:backend  # backend TypeScript compile
```

## How it works

1. You provide a **job description** and **resume**.
2. Contact info is **extracted from the resume header** and saved to `data/applicant.json` (when saving or before generation).
3. Contact details are **removed from the resume text** sent to the model so the AI focuses on experience and skills.
4. Claude returns the cover letter **body** and an inferred **company name**.
5. The app assembles the final document:

```
Your Name
City, ST [ZIP]
email@example.com | (555) 555-5555

Month Day, Year

Hiring Manager
Company Name

Dear Hiring Manager,

[Cover letter body paragraphs]

Sincerely,
Your Name
```

If any required contact fields are missing, the letter still generates but a warning appears suggesting you fix the resume header.

## Resume formatting for contact parsing

Contact extraction reads only the **header** of your resume — the lines at the top, before the first major section. Getting this right ensures the cover letter heading is complete.

### Header placement

Put your contact information at the **very top** of the resume, before any section such as:

- Summary / Professional Summary
- Experience / Work Experience
- Education
- Skills / Technical Skills
- Projects

The parser reads up to **5 header lines** and stops at the first recognized section heading.

### Recommended header layout

Use separate lines for name, location, and contact details:

```
Jane Doe
San Francisco, CA 94102
jane.doe@email.com | (415) 555-1234
```

You can also combine location and contact on one line:

```
Jane Doe
San Francisco, CA | jane.doe@email.com | (415) 555-1234
```

### Field requirements

| Field | How it is parsed | Notes |
| --- | --- | --- |
| **Full name** | First non-contact line in the header | Must appear before email, phone, or URLs on their own line. |
| **City & state** | `City, ST` or `City, ST ZIP` | State must be a **2-letter abbreviation** (e.g. `NJ`, `CA`). ZIP is optional (`94102` or `94102-1234`). |
| **Email** | Standard email pattern | e.g. `name@domain.com` |
| **Phone** | US-style numbers | Supports formats like `(732) 674-3733`, `732-674-3733`, `732.674.3733`, and optional `+1` country code. |

All five of **name, city, state, email, and phone** must be present for a complete header. ZIP is optional.

### PDF and single-line headers

When a resume is pasted or extracted as one long line (common with some PDF exports), the parser detects a "collapsed" layout and splits the header on line breaks, `|`, or `•` before the first section keyword (e.g. `Summary`, `Experience`).

For best results with PDFs, ensure your name and contact info appear **before** the word `Summary` or `Experience` in the extracted text, separated by `|` or line breaks if possible.

### What gets stripped from the resume

When saving or sending a resume to the model, the following are removed from the resume text:

- The entire header block (name, location, contact lines)
- Inline email addresses, phone numbers, URLs, LinkedIn, and GitHub links

Your saved resume under **My Resume** therefore contains only professional content (summary, experience, skills, etc.) without contact details.

## Using the app

### Resume sources

| Tab | Behavior |
| --- | --- |
| **Paste** | One-off resume text. Contact info is extracted at generation time but not persisted unless you save under My Resume. |
| **Upload** | Accepts `.txt`, `.md`, `.docx`, or `.pdf`. You can optionally save the uploaded resume for future use. |
| **My Resume** | Uses `data/resume.txt` (contact info already removed). Best for repeat use without re-pasting. |

### Saving a resume

Use **Save resume** under the Upload or My Resume tab. This will:

1. Extract contact info into `data/applicant.json`
2. Strip contact details from the resume text
3. Write the sanitized resume to `data/resume.txt`

Both files are gitignored and stay on your machine.

### Exporting the cover letter

After generation, use the buttons above the result:

| Action | Description |
| --- | --- |
| **Download .docx** | Word document with the full formatted letter (Calibri 11pt, 1" margins). Filename includes the company name when available. |
| **Download PDF** | PDF with the same layout and content (Helvetica 11pt, 1" margins). Useful for email attachments or systems that prefer PDF. |
| **Copy for Word** | Copies the plain-text formatted letter to the clipboard for pasting into Word or another editor. |

## API

Local backend endpoints (proxied at `/api` in development):

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Health check |
| `GET` | `/api/resume` | Read saved resume |
| `PUT` | `/api/resume` | Save resume (strips contact info) |
| `DELETE` | `/api/resume` | Clear saved resume and applicant info |
| `GET` | `/api/applicant` | Read extracted contact info |
| `PUT` | `/api/applicant/extract` | Extract contact info from resume text |
| `POST` | `/api/generate` | Generate a cover letter |

**Generate request body:**

```json
{
  "jobDescription": "...",
  "resumeText": "..."
}
```

**Generate response:**

```json
{
  "coverLetter": "Body paragraphs only, separated by \\n\\n",
  "companyName": "Employer name inferred from the posting"
}
```

## Project structure

```
cover-letter-generator/
├── api/                  # Vercel serverless handler (generate only)
├── backend/              # Express API for local development
├── frontend/             # React + Vite UI
├── lib/                  # Shared code (prompts, schemas, services, utils)
│   ├── prompts/          # Claude system/user/retry prompts
│   ├── schemas/          # Zod schemas for API payloads
│   ├── services/         # Cover letter generation, file storage
│   └── utils/            # Contact extraction, resume normalization, formatting
├── data/                 # Local storage (gitignored)
│   ├── resume.txt        # Saved resume without contact info
│   └── applicant.json    # Extracted name, location, email, phone
├── package.json          # Root scripts and shared dependencies
└── vercel.json           # Frontend deployment config
```

Shared logic in `lib/` is used by both the Express backend and the Vercel serverless function. Resume storage and applicant extraction require the full backend running locally; production deployment on Vercel currently exposes only the `/api/generate` endpoint.

## Environment variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `ANTHROPIC_API_KEY` | Yes | — | Anthropic API key for cover letter generation |
| `ANTHROPIC_MODEL` | No | `claude-sonnet-4-6` | Claude model ID |
| `PORT` | No | `3001` | Backend port (local development) |

## Deployment

The project includes a `vercel.json` config for deploying the frontend. Set `ANTHROPIC_API_KEY` (and optionally `ANTHROPIC_MODEL`) in your Vercel project environment variables. The serverless `api/generate.ts` handler serves cover letter generation in production; resume persistence features require the Express backend.
