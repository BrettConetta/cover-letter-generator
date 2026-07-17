import { z } from "zod";

export const ApplicantInfoSchema = z.object({
  fullName: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string().optional(),
  email: z.string(),
  phone: z.string(),
});

export type ApplicantInfo = z.infer<typeof ApplicantInfoSchema>;

export const EMPTY_APPLICANT: ApplicantInfo = {
  fullName: "",
  city: "",
  state: "",
  email: "",
  phone: "",
};

export function isApplicantComplete(applicant: ApplicantInfo): boolean {
  return (
    applicant.fullName.trim().length > 0 &&
    applicant.city.trim().length > 0 &&
    applicant.state.trim().length > 0 &&
    applicant.email.trim().length > 0 &&
    applicant.phone.trim().length > 0
  );
}

export function mergeApplicantInfo(
  existing: ApplicantInfo,
  extracted: ApplicantInfo,
): ApplicantInfo {
  return {
    fullName: extracted.fullName.trim() || existing.fullName,
    city: extracted.city.trim() || existing.city,
    state: extracted.state.trim() || existing.state,
    zip: extracted.zip?.trim() || existing.zip,
    email: extracted.email.trim() || existing.email,
    phone: extracted.phone.trim() || existing.phone,
  };
}
