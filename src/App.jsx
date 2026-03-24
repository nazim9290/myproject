import { useState, useEffect } from "react";
import {
  Home, Users, GraduationCap, BookOpen, ClipboardList, FileText, Building,
  FileCheck, Award, Plane, CheckCircle, Phone, Briefcase, Globe, DollarSign,
  Package, TrendingUp, Calendar, Lock, User, Settings, Bell, Search,
  Menu, X, ChevronLeft, ChevronRight,
} from "lucide-react";

import { THEMES, ThemeContext, getGlobalStyles, ThemeToggle } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NAV_ITEMS } from "./data/mockData";
import { students as studentsApi, visitors as visitorsApi } from "./lib/api";
import { api } from "./hooks/useAPI";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import VisitorsPage from "./pages/visitors/VisitorsPage";
import StudentsPage from "./pages/students/StudentsPage";
import LanguageCoursePage from "./pages/courses/LanguageCoursePage";
import AttendancePage from "./pages/attendance/AttendancePage";
import DocumentsPage from "./pages/documents/DocumentsPage";
import SchoolsPage from "./pages/schools/SchoolsPage";
import ExcelAutoFillPage from "./pages/excel/ExcelAutoFillPage";
import CertificatePage from "./pages/certificates/CertificatePage";
import PreDeparturePage from "./pages/predeparture/PreDeparturePage";
import TasksPage from "./pages/tasks/TasksPage";
import CommunicationPage from "./pages/communication/CommunicationPage";
import AgentsPage from "./pages/agents/AgentsPage";
import PartnerAgencyPage from "./pages/partners/PartnerAgencyPage";
import AccountsPage from "./pages/accounts/AccountsPage";
import InventoryPage from "./pages/inventory/InventoryPage";
import HRPage from "./pages/hr/HRPage";
import ReportsPage from "./pages/reports/ReportsPage";
import CalendarPage from "./pages/calendar/CalendarPage";
import UserRolePage from "./pages/users/UserRolePage";
import StudentPortalPage from "./pages/portal/StudentPortalPage";
import SettingsPage from "./pages/settings/SettingsPage";
import ProfilePage from "./pages/profile/ProfilePage";

const NAV_ICONS = {
  dashboard: Home,
  visitors: Users,
  students: GraduationCap,
  course: BookOpen,
  attendance: ClipboardList,
  documents: FileText,
  schools: Building,
  excel: FileCheck,
  certificates: Award,
  departure: Plane,
  tasks: CheckCircle,
  communication: Phone,
  agents: Briefcase,
  partners: Globe,
  accounts: DollarSign,
  inventory: Package,
  hr: Users,
  reports: TrendingUp,
  calendar: Calendar,
  users: Lock,
  portal: User,
  settings: Settings,
};

function Sidebar({ activePage, setActivePage, t, collapsed, setCollapsed, mobileOpen, setMobileOpen, isMobile }) {
  const w = collapsed ? 64 : 220;
  const visible = isMobile ? mobileOpen : true;

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-20"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className="fixed top-0 left-0 h-full z-30 flex flex-col"
        style={{
          width: w,
          background: t.sidebar,
          borderRight: `1px solid rgba(255,255,255,0.05)`,
          transition: "width 0.25s ease, transform 0.25s ease",
          transform: visible ? "translateX(0)" : "translateX(-100%)",
          boxShadow: isMobile && mobileOpen ? "4px 0 32px rgba(0,0,0,0.4)" : "none",
          overflow: "hidden",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 px-4 shrink-0"
          style={{ height: 60, borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div
            className="shrink-0 h-8 w-8 rounded-xl flex items-center justify-center text-xs font-black"
            style={{ background: "linear-gradient(135deg, #06b6d4, #a855f7)" }}
          >
            <span style={{ color: "#fff" }}>A</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: "#fff" }}>AgencyOS</p>
              <p className="text-[9px] truncate" style={{ color: "rgba(255,255,255,0.35)" }}>Study Abroad CRM</p>
            </div>
          )}
          {isMobile && (
            <button className="ml-auto p-1 shrink-0" style={{ color: "rgba(255,255,255,0.4)" }} onClick={() => setMobileOpen(false)}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = NAV_ICONS[item.key] || Home;
            const active = activePage === item.key;
            return (
              <button
                key={item.key}
                title={collapsed ? item.label : undefined}
                onClick={() => { setActivePage(item.key); if (isMobile) setMobileOpen(false); }}
                className="w-full flex items-center rounded-lg mb-0.5 text-left transition-all"
                style={{
                  gap: collapsed ? 0 : 10,
                  padding: collapsed ? "8px 0" : "8px 12px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  background: active ? t.sidebarActiveBg : "transparent",
                  color: active ? t.sidebarTextActive : t.sidebarText,
                  fontWeight: active ? 600 : 400,
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = t.sidebarHoverBg; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <Icon size={15} className="shrink-0" />
                {!collapsed && (
                  <>
                    <span className="text-xs flex-1 truncate">{item.label}</span>
                    {item.badge ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: "#06b6d420", color: "#06b6d4" }}>
                        {item.badge}
                      </span>
                    ) : null}
                  </>
                )}
                {collapsed && item.badge ? (
                  <span className="absolute top-0.5 right-0.5 h-3.5 w-3.5 rounded-full text-[8px] font-bold flex items-center justify-center" style={{ background: "#06b6d4", color: "#fff" }}>
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Desktop collapse toggle */}
        {!isMobile && (
          <div className="shrink-0 p-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <button
              onClick={() => setCollapsed((v) => !v)}
              className="w-full flex items-center justify-center p-2 rounded-lg transition-all"
              style={{ color: "rgba(255,255,255,0.35)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

function Header({ t, activePage, isDark, setIsDark, isMobile, setMobileOpen, alertItems, onDismiss, onDismissAll, setActivePage, currentUser }) {
  const navItem = NAV_ITEMS.find((n) => n.key === activePage);
  const pageLabel = navItem?.label || "Dashboard";
  const [showAlerts, setShowAlerts] = useState(false);

  useEffect(() => {
    if (!showAlerts) return;
    const close = () => setShowAlerts(false);
    const timer = setTimeout(() => document.addEventListener("click", close), 0);
    return () => { clearTimeout(timer); document.removeEventListener("click", close); };
  }, [showAlerts]);

  return (
    <header
      className="flex items-center gap-3 px-4"
      style={{
        height: 60,
        background: t.mode === "dark" ? "rgba(10,12,16,0.85)" : "rgba(248,250,252,0.92)",
        borderBottom: `1px solid ${t.border}`,
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 10,
        flexShrink: 0,
      }}
    >
      {/* Hamburger — mobile only */}
      {isMobile && (
        <button
          className="p-2 rounded-lg transition shrink-0"
          style={{ color: t.muted }}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <Menu size={18} />
        </button>
      )}

      <p className="text-sm font-bold shrink-0" style={{ color: t.text }}>{pageLabel}</p>

      {/* Search */}
      <div className="flex-1 max-w-sm mx-2">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}
        >
          <Search size={13} style={{ color: t.muted }} />
          <input
            type="text"
            placeholder="স্টুডেন্ট, ভিজিটর, স্কুল খুঁজুন..."
            className="bg-transparent outline-none text-xs flex-1"
            style={{ color: t.text }}
          />
        </div>
      </div>

      <div className="flex items-center gap-1 ml-auto">
        {/* Bell */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            className="relative p-2 rounded-lg transition shrink-0"
            style={{ color: alertItems.length > 0 ? t.text : t.muted }}
            onClick={() => setShowAlerts((v) => !v)}
          >
            <Bell size={16} />
            {alertItems.length > 0 && (
              <span
                className="absolute top-1 right-1 h-3.5 w-3.5 rounded-full text-[8px] font-bold flex items-center justify-center"
                style={{ background: "#ef4444", color: "#fff" }}
              >
                {alertItems.length > 9 ? "9+" : alertItems.length}
              </span>
            )}
          </button>

          {showAlerts && (
            <div
              className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-2xl z-50 overflow-hidden"
              style={{ background: t.card, border: `1px solid ${t.border}` }}
            >
              <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: `1px solid ${t.border}` }}>
                <p className="text-xs font-bold">Notifications {alertItems.length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: "#ef444420", color: "#ef4444" }}>{alertItems.length}</span>}</p>
                {alertItems.length > 0 && (
                  <button
                    className="text-[10px] px-2 py-1 rounded-lg transition"
                    style={{ color: t.muted }}
                    onClick={(e) => { e.stopPropagation(); onDismissAll(); }}
                    onMouseEnter={(e) => e.currentTarget.style.color = t.text}
                    onMouseLeave={(e) => e.currentTarget.style.color = t.muted}
                  >
                    সব মুছুন
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {alertItems.length === 0 ? (
                  <p className="p-5 text-xs text-center" style={{ color: t.muted }}>কোনো নতুন নোটিফিকেশন নেই ✓</p>
                ) : (
                  alertItems.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-start gap-3 px-4 py-3 transition-all group"
                      style={{ borderBottom: `1px solid ${t.border}40` }}
                      onMouseEnter={(e) => e.currentTarget.style.background = t.hoverBg}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <div className="h-2 w-2 rounded-full mt-1.5 shrink-0" style={{ background: alert.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium leading-snug">{alert.label}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: t.muted }}>{alert.sub}</p>
                      </div>
                      <button
                        className="shrink-0 p-0.5 rounded transition opacity-0 group-hover:opacity-100"
                        style={{ color: t.muted }}
                        onClick={(e) => { e.stopPropagation(); onDismiss(alert.id); }}
                        title="মুছুন"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <ThemeToggle isDark={isDark} onToggle={() => setIsDark((v) => !v)} />

        {/* Profile avatar */}
        <button
          className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ml-1 transition hover:scale-110"
          style={{ background: "linear-gradient(135deg, #06b6d4, #a855f7)", color: "#fff" }}
          title={currentUser?.name || "Profile"}
          onClick={() => setActivePage("profile")}
        >
          {(currentUser?.name || "U").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
        </button>
      </div>
    </header>
  );
}

function PageRenderer({ activePage, students, setStudents, visitors, setVisitors, onConvertToStudent, isDark, setIsDark, currentUser, setCurrentUser, onLogout, reloadData }) {
  switch (activePage) {
    case "dashboard":
      return <DashboardPage students={students} visitors={visitors} />;
    case "visitors":
      return <VisitorsPage visitors={visitors} setVisitors={setVisitors} onConvertToStudent={onConvertToStudent} reloadData={reloadData} />;
    case "students":
      return <StudentsPage students={students} setStudents={setStudents} reloadData={reloadData} />;
    case "course":
      return <LanguageCoursePage students={students} />;
    case "attendance":
      return <AttendancePage students={students} />;
    case "documents":
      return <DocumentsPage students={students} />;
    case "schools":
      return <SchoolsPage students={students} />;
    case "excel":
      return <ExcelAutoFillPage students={students} />;
    case "certificates":
      return <CertificatePage students={students} />;
    case "departure":
      return <PreDeparturePage students={students} />;
    case "tasks":
      return <TasksPage students={students} />;
    case "communication":
      return <CommunicationPage students={students} />;
    case "agents":
      return <AgentsPage />;
    case "partners":
      return <PartnerAgencyPage />;
    case "accounts":
      return <AccountsPage students={students} />;
    case "inventory":
      return <InventoryPage />;
    case "hr":
      return <HRPage />;
    case "reports":
      return <ReportsPage students={students} />;
    case "calendar":
      return <CalendarPage students={students} />;
    case "users":
      return <UserRolePage />;
    case "portal":
      return <StudentPortalPage />;
    case "settings":
      return <SettingsPage isDark={isDark} setIsDark={setIsDark} students={students} visitors={visitors} />;
    case "profile":
      return <ProfilePage currentUser={currentUser} setCurrentUser={setCurrentUser} onLogout={onLogout} isDark={isDark} setIsDark={setIsDark} />;
    default:
      return <DashboardPage students={students} visitors={visitors} />;
  }
}

function AppShell({ isDark, setIsDark }) {
  const t = THEMES[isDark ? "dark" : "light"];
  const { user: authUser, login, setMockUser, logout, loading: authLoading } = useAuth();
  const [activePage, setActivePage] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);   // desktop collapse
  const [mobileOpen, setMobileOpen] = useState(false); // mobile overlay
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [students, setStudents] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    name: "Admin",
    name_bn: "অ্যাডমিন",
    email: "admin@agencyos.com",
    phone: "",
    role: "owner",
    designation: "Agency Manager",
    branch: "Main",
    joined: "2026-01-01",
    notifications: true,
    language: "bn",
  });

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // ── Backend API থেকে সব data load করো ──
  const loadAllData = async () => {
    const token = localStorage.getItem("agencyos_token");
    console.log("[App] loadAllData called, token:", token ? "আছে (" + token.substring(0, 15) + "...)" : "নেই");
    if (!token) { setDataLoaded(true); return; } // token ছাড়া API call করার দরকার নেই

    try {
      const [studRes, visRes] = await Promise.all([
        studentsApi.list({ limit: 500 }),
        visitorsApi.list({ limit: 500 }),
      ]);
      // students/visitors API response: { data: [...] } format
      const studs = Array.isArray(studRes) ? studRes : studRes.data || [];
      const visis = Array.isArray(visRes) ? visRes : visRes.data || [];
      console.log("[App] Loaded:", studs.length, "students,", visis.length, "visitors");
      setStudents(studs);
      setVisitors(visis);
    } catch (err) {
      console.log("[App] API থেকে data load ব্যর্থ:", err.message);
    }
    setDataLoaded(true);
  };

  // authUser change হলে বা প্রথমবার — data load করো
  // authLoading শেষ হওয়ার পরই data load শুরু হবে
  useEffect(() => {
    if (authLoading) return;       // auth restore চলছে, wait করো
    if (dataLoaded) return;        // ইতিমধ্যে load হয়ে গেছে
    if (authUser) {
      loadAllData();               // logged in → data load
    } else {
      setDataLoaded(true);         // logged out → data load দরকার নেই
    }
  }, [authUser, authLoading, dataLoaded]);

  // Sync authUser → currentUser
  useEffect(() => {
    if (authUser) {
      setCurrentUser((prev) => ({
        ...prev,
        name: authUser.name || prev.name,
        email: authUser.email || prev.email,
        role: authUser.role || prev.role,
        branch: authUser.branch || prev.branch,
      }));
    }
  }, [authUser]);

  const onConvertToStudent = async (visitor) => {
    const newStudent = {
      id: `S-2026-${String(students.length + 1).padStart(3, "0")}`,
      name_en: visitor.name_en || visitor.name || "",
      name_bn: visitor.name || "",
      phone: visitor.phone || "",
      email: visitor.email || "",
      dob: visitor.dob || "",
      gender: visitor.gender || "",
      passport: visitor.passport || "",
      father: visitor.father || "",
      mother: visitor.mother || "",
      country: (visitor.interested_countries && visitor.interested_countries[0]) || "Japan",
      school: "",
      batch: visitor.interested_intake || "",
      source: visitor.source || "",
      counselor: visitor.counselor || "",
      agent: visitor.agent_name || "",
      type: "own",
      status: "ENROLLED",
      docs: [],
      created: new Date().toISOString().slice(0, 10),
    };

    // Try API first, fallback to local
    try {
      const apiStudent = await visitorsApi.convert(visitor.id, {
        country: newStudent.country,
        batch: newStudent.batch,
      });
      setStudents((prev) => [apiStudent, ...prev]);
    } catch {
      setStudents((prev) => [newStudent, ...prev]);
    }

    setVisitors((prev) => prev.map((v) => v.id === visitor.id ? { ...v, converted: true, status: "converted" } : v));
    setActivePage("students");
  };

  const [dismissedIds, setDismissedIds] = useState(new Set());
  const dismissAlert = (id) => setDismissedIds((prev) => new Set([...prev, id]));
  const dismissAll = () => setDismissedIds((prev) => new Set([...prev, ...allAlertItems.map((a) => a.id)]));

  const today = new Date().toISOString().slice(0, 10);
  const allAlertItems = [
    ...visitors
      .filter((v) => !v.converted && ["Interested", "Thinking", "Follow Up"].includes(v.status) && v.lastFollowUp && v.lastFollowUp < today)
      .slice(0, 4)
      .map((v) => ({ id: `fu-${v.id}`, label: `Follow-up বাকি: ${v.name_en || v.name}`, sub: `শেষ যোগাযোগ: ${v.lastFollowUp}`, color: "#f59e0b" })),
    ...students
      .filter((s) => s.status === "DOC_COLLECTION")
      .map((s) => ({ id: `doc-${s.id}`, label: `ডকুমেন্ট দরকার: ${s.name_en}`, sub: "DOC_COLLECTION — দ্রুত সংগ্রহ করুন", color: "#a855f7" })),
    ...students
      .filter((s) => s.status === "COE_RECEIVED")
      .map((s) => ({ id: `coe-${s.id}`, label: `COE পেয়েছে: ${s.name_en}`, sub: "Health Check শিডিউল করুন", color: "#06b6d4" })),
    ...students
      .filter((s) => s.status === "SCHOOL_INTERVIEW")
      .map((s) => ({ id: `si-${s.id}`, label: `ইন্টারভিউ শিডিউল করুন: ${s.name_en}`, sub: "School Interview পেন্ডিং", color: "#c084fc" })),
    ...students
      .filter((s) => s.status === "VISA_GRANTED")
      .map((s) => ({ id: `vg-${s.id}`, label: `ভিসা পেয়েছে: ${s.name_en}`, sub: "Pre-Departure শুরু করুন", color: "#10b981" })),
  ];
  const alertItems = allAlertItems.filter((a) => !dismissedIds.has(a.id));
  const sidebarW = isMobile ? 0 : (collapsed ? 64 : 220);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = getGlobalStyles(t);
    document.head.appendChild(style);
    document.body.style.background = t.bg;
    document.body.style.color = t.text;
    document.body.style.fontFamily = "'DM Sans', 'Noto Sans Bengali', sans-serif";
    return () => document.head.removeChild(style);
  }, [isDark]);

  const handleLogin = (user) => {
    // LoginPage থেকে user আসে — real login হলে AuthContext ইতিমধ্যে user set করেছে
    // Mock login হলে (token নেই) setMockUser call করো
    if (!localStorage.getItem("agencyos_token")) {
      setMockUser(user);
    }
    setCurrentUser((prev) => ({
      ...prev,
      name: user.name || prev.name,
      email: user.email || prev.email,
      role: user.role || prev.role,
      branch: user.branch || prev.branch,
    }));
    // Login-এর পর data load করো
    setDataLoaded(false);
  };

  const handleLogout = () => {
    logout();
    setDataLoaded(false);
    setStudents([]);
    setVisitors([]);
  };

  // Reload data after CRUD operations
  const reloadData = () => { setDataLoaded(false); };

  if (authLoading) {
    return (
      <ThemeContext.Provider value={t}>
        <div className="flex h-screen items-center justify-center" style={{ background: t.bg }}>
          <div className="text-center anim-fade">
            <div className="h-10 w-10 mx-auto mb-3 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${t.cyan}, ${t.purple})` }}>
              <span className="text-white font-black text-sm">A</span>
            </div>
            <p className="text-xs" style={{ color: t.muted }}>Loading...</p>
          </div>
        </div>
      </ThemeContext.Provider>
    );
  }

  if (!authUser) {
    return (
      <ThemeContext.Provider value={t}>
        <LoginPage onLogin={handleLogin} />
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={t}>
      <div className="flex h-screen overflow-hidden" style={{ background: t.bg }}>
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          t={t}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          isMobile={isMobile}
        />

        <div
          className="flex flex-col flex-1 min-w-0"
          style={{ marginLeft: sidebarW, transition: "margin-left 0.25s ease" }}
        >
          <Header
            t={t}
            activePage={activePage}
            isDark={isDark}
            setIsDark={setIsDark}
            isMobile={isMobile}
            setMobileOpen={setMobileOpen}
            alertItems={alertItems}
            onDismiss={dismissAlert}
            onDismissAll={dismissAll}
            setActivePage={setActivePage}
            currentUser={currentUser}
          />

          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <PageRenderer
              activePage={activePage}
              students={students}
              setStudents={setStudents}
              visitors={visitors}
              setVisitors={setVisitors}
              onConvertToStudent={onConvertToStudent}
              isDark={isDark}
              setIsDark={setIsDark}
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
              onLogout={handleLogout}
              reloadData={reloadData}
            />
          </main>
        </div>
      </div>
    </ThemeContext.Provider>
  );
}

export default function App() {
  const [isDark, setIsDark] = useState(true);

  return (
    <AuthProvider>
      <ToastProvider>
        <AppShell isDark={isDark} setIsDark={setIsDark} />
      </ToastProvider>
    </AuthProvider>
  );
}
