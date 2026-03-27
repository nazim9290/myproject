import { createContext, useContext, useState, useEffect } from "react";

/**
 * PermissionContext — Role-based access control
 *
 * Login-এর পর backend থেকে user-এর permissions load করে।
 * যেকোনো component থেকে usePermissions() দিয়ে check করা যায়:
 *   const { canRead, canWrite, canDelete, hasAccess } = usePermissions();
 *   if (canRead("students")) { ... }
 */

// ── Default Permission Matrix (offline fallback) ──
const DEFAULT_PERMISSIONS = {
  owner:              { dashboard: "rwd", visitors: "rwd", students: "rwd", documents: "rwd", accounts: "rwd", reports: "rwd", settings: "rwd", users: "rwd", schools: "rwd", course: "rwd", attendance: "rwd", hr: "rwd", agents: "rwd", partners: "rwd", inventory: "rwd", calendar: "rwd", communication: "rwd", tasks: "rwd", help: "r", portal: "r" },
  branch_manager:     { dashboard: "rw",  visitors: "rwd", students: "rwd", documents: "rwd", accounts: "rw",  reports: "r",   settings: "",   users: "",    schools: "rw",  course: "rw",  attendance: "rw",  hr: "r",   agents: "rw",  partners: "rw",  inventory: "rw",  calendar: "rw",  communication: "rw",  tasks: "rwd", help: "r", portal: "r" },
  counselor:          { dashboard: "r",   visitors: "rw",  students: "rw",  documents: "r",   accounts: "",    reports: "",    settings: "",   users: "",    schools: "r",   course: "",    attendance: "",    hr: "",    agents: "",    partners: "",    inventory: "",    calendar: "r",   communication: "rw",  tasks: "rw",  help: "r", portal: "" },
  "follow-up_executive":{ dashboard: "r",   visitors: "rw",  students: "r",   documents: "",    accounts: "",    reports: "",    settings: "",   users: "",    schools: "",    course: "",    attendance: "",    hr: "",    agents: "",    partners: "",    inventory: "",    calendar: "r",   communication: "rw",  tasks: "rw",  help: "r", portal: "" },
  admission_officer:  { dashboard: "r",   visitors: "rw",  students: "rwd", documents: "rw",  accounts: "r",   reports: "",    settings: "",   users: "",    schools: "r",   course: "r",   attendance: "",    hr: "",    agents: "r",   partners: "r",   inventory: "",    calendar: "r",   communication: "rw",  tasks: "rw",  help: "r", portal: "" },
  language_teacher:   { dashboard: "r",   visitors: "",    students: "r",   documents: "",    accounts: "",    reports: "",    settings: "",   users: "",    schools: "",    course: "rw",  attendance: "rw",  hr: "",    agents: "",    partners: "",    inventory: "",    calendar: "r",   communication: "",    tasks: "r",   help: "r", portal: "" },
  document_collector: { dashboard: "",    visitors: "",    students: "r",   documents: "rw",  accounts: "",    reports: "",    settings: "",   users: "",    schools: "",    course: "",    attendance: "",    hr: "",    agents: "",    partners: "",    inventory: "",    calendar: "",    communication: "r",   tasks: "r",   help: "r", portal: "" },
  document_processor: { dashboard: "",    visitors: "",    students: "r",   documents: "rwd", accounts: "",    reports: "",    settings: "",   users: "",    schools: "r",   course: "",    attendance: "",    hr: "",    agents: "",    partners: "",    inventory: "",    calendar: "",    communication: "r",   tasks: "r",   help: "r", portal: "" },
  accounts:           { dashboard: "r",   visitors: "",    students: "r",   documents: "",    accounts: "rwd", reports: "r",   settings: "",   users: "",    schools: "",    course: "",    attendance: "",    hr: "r",   agents: "r",   partners: "r",   inventory: "rw",  calendar: "r",   communication: "",    tasks: "r",   help: "r", portal: "" },
};

// NAV_ITEMS key → permission module mapping
const NAV_MODULE_MAP = {
  dashboard: "dashboard", visitors: "visitors", students: "students",
  course: "course", attendance: "attendance", documents: "documents",
  schools: "schools", excel: "documents", certificates: "documents",
  departure: "students", tasks: "tasks", communication: "communication",
  agents: "agents", partners: "partners", accounts: "accounts",
  inventory: "inventory", hr: "hr", reports: "reports", calendar: "calendar",
  users: "users", portal: "portal", settings: "settings", help: "help",
};

function normalizeRole(role) {
  if (!role) return "counselor";
  return role.toLowerCase().replace(/\s+/g, "_");
}

function getPermsForRole(role) {
  const normalized = normalizeRole(role);
  return DEFAULT_PERMISSIONS[normalized] || DEFAULT_PERMISSIONS.counselor;
}

const PermissionContext = createContext({});

export function PermissionProvider({ children, userRole }) {
  const [perms, setPerms] = useState(() => getPermsForRole(userRole));

  useEffect(() => {
    setPerms(getPermsForRole(userRole));
  }, [userRole]);

  // Check functions
  const canRead = (module) => (perms[module] || "").includes("r");
  const canWrite = (module) => (perms[module] || "").includes("w");
  const canDelete = (module) => (perms[module] || "").includes("d");
  const hasAccess = (module) => (perms[module] || "").length > 0;

  // NAV_ITEMS key দিয়ে check — sidebar filtering-এ ব্যবহার হবে
  const canAccessPage = (navKey) => {
    const module = NAV_MODULE_MAP[navKey] || navKey;
    return hasAccess(module);
  };

  return (
    <PermissionContext.Provider value={{ perms, canRead, canWrite, canDelete, hasAccess, canAccessPage, role: userRole }}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  return useContext(PermissionContext);
}

export { DEFAULT_PERMISSIONS, NAV_MODULE_MAP, normalizeRole };
