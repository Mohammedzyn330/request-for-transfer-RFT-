export const ROLE_KEYS = {
  FORM_PREPARER: "FORM_PREPARER",
  VERIFIER: "VERIFIER",
  APPROVER: "APPROVER",
  FINANCE: "FINANCE",
  ADMIN: "ADMIN",
};

export const ROLE_ROUTES = {
  [ROLE_KEYS.FORM_PREPARER]: {
    default: "/preparer-dashboard",
    allowed: ["/form-prepare", "/preparer-dashboard", "/customer-list"],
  },
  [ROLE_KEYS.VERIFIER]: {
    default: "/verifier",
    allowed: ["/verifier"],
  },
  [ROLE_KEYS.APPROVER]: {
    default: "/approver",
    allowed: ["/report", "/approver"],
  },
  [ROLE_KEYS.FINANCE]: {
    default: "/dashboard",
    allowed: ["/dashboard", "/payment-completion"],
  },
  [ROLE_KEYS.ADMIN]: {
    default: "/admin/dashboard",
    allowed: ["/admin/dashboard", "/admin/register"],
  },
};
