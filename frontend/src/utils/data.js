export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "/api";

export const USER_API_ENDPOINT = `${API_BASE_URL}/user`;
export const JOB_API_ENDPOINT = `${API_BASE_URL}/job`;
export const COMPANY_API_ENDPOINT = `${API_BASE_URL}/company`;
export const APPLICATION_API_ENDPOINT = `${API_BASE_URL}/application`;

export const USER_ROLES = {
  APPLICANT: "Applicant",
  STUDENT: "Student",
  RECRUITER: "Recruiter",
  SUPER_ADMIN: "SuperAdmin",
};

export const APPLICANT_ROLE_VALUES = [USER_ROLES.APPLICANT, USER_ROLES.STUDENT];

export const isApplicantRole = (role) => APPLICANT_ROLE_VALUES.includes(role);

export const normalizeRoleLabel = (role) => {
  if (isApplicantRole(role)) return USER_ROLES.APPLICANT;
  if (role === USER_ROLES.SUPER_ADMIN) return "Super Admin";
  return role;
};
