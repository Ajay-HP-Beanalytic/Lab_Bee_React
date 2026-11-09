import CalculateIcon from "@mui/icons-material/Calculate";
import NewspaperIcon from "@mui/icons-material/Newspaper";
import TuneIcon from "@mui/icons-material/Tune";
import TimerIcon from "@mui/icons-material/Timer";
import HomeIcon from "@mui/icons-material/Home";
import CalendarMonthSharpIcon from "@mui/icons-material/CalendarMonthSharp";
import ArticleIcon from "@mui/icons-material/Article";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import KitchenIcon from "@mui/icons-material/Kitchen";
import BuildCircleIcon from "@mui/icons-material/BuildCircle";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ScienceIcon from "@mui/icons-material/Science";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import MarkEmailUnreadIcon from "@mui/icons-material/MarkEmailUnread";
import InsightsIcon from "@mui/icons-material/Insights";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import VerifiedIcon from "@mui/icons-material/Verified";
import CategoryIcon from "@mui/icons-material/Category";
import EventRepeatIcon from "@mui/icons-material/EventRepeat";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
import AppsIcon from "@mui/icons-material/Apps";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import { Source } from "@mui/icons-material";

// Side-menu groups, in their usual order (a department's own group is shown first)
export const MENU_GROUPS = [
  { id: "general", label: "General", icon: <AppsIcon /> },
  { id: "sales", label: "Enquiries & Quotes", icon: <RequestQuoteIcon /> },
  { id: "ts1", label: "TS1 Environmental", icon: <ScienceIcon /> },
  { id: "ts2", label: "TS2 EMI / EMC", icon: <ElectricBoltIcon /> },
  { id: "setup", label: "Lab Setup", icon: <SettingsSuggestIcon /> },
  { id: "projects", label: "Projects", icon: <FolderOpenIcon /> },
  { id: "admin", label: "Administration", icon: <AdminPanelSettingsIcon /> },
];

/**
 * Side-menu items. key: as stored in the access rules (Backend access/accessControl.js
 * MENU_KEYS); path: the page; also: other pages that belong to it (first part of the URL),
 * so they are allowed with it.
 */
export const MENU_ITEMS = [
  { key: "home", label: "Home", path: "/home", group: "general", icon: <HomeIcon /> },
  { key: "org_docs", label: "Org Documents", path: "/org_docs", group: "general", icon: <Source /> },

  { key: "rfq_inbox", label: "Enquiries", path: "/rfq_inbox", group: "sales", icon: <MarkEmailUnreadIcon /> },
  { key: "rfq_dashboard", label: "Enquiry Dashboard", path: "/rfq_dashboard", group: "sales", icon: <InsightsIcon /> },
  { key: "quotations", label: "Quotations", path: "/quotation_dashboard", also: ["quotation"], group: "sales", icon: <CurrencyRupeeIcon /> },
  { key: "quotation_essentials", label: "Quotation Essentials", path: "/quotation_essentials", group: "sales", icon: <NoteAddIcon /> },
  { key: "future_scope", label: "Future Scope", path: "/future_scope", group: "sales", icon: <TipsAndUpdatesIcon /> },
  { key: "marketing", label: "Marketing Content", path: "/marketing", group: "sales", icon: <NewspaperIcon /> },

  { key: "ts1_jobcards", label: "Job Cards", path: "/jobcard_dashboard", also: ["jobcard", "ts1_jc_insights"], group: "ts1", icon: <ArticleIcon /> },
  { key: "ts1_reports", label: "Reports", path: "/ts1_reports", also: ["ts1_reports_insights"], group: "ts1", icon: <AssignmentTurnedInIcon /> },
  { key: "ts1_slot_booking", label: "Slot Booking", path: "/slot_booking", group: "ts1", icon: <CalendarMonthSharpIcon /> },
  { key: "ts1_chambers", label: "Chambers & Calibration", path: "/chamber-calibration", group: "ts1", icon: <KitchenIcon /> },
  { key: "ts1_breakdowns", label: "Breakdowns & Spares", path: "/chamber_breakdowns", group: "ts1", icon: <BuildCircleIcon /> },
  { key: "ts1_hours", label: "Hours Calculation", path: "/ts1_utitlity", group: "ts1", icon: <CalculateIcon /> },
  { key: "ts1_jc_essentials", label: "JC Essentials", path: "/jobcard_essentials", group: "ts1", icon: <NoteAddIcon /> },

  { key: "ts2_jobcards", label: "Job Cards", path: "/emi_jc_dashboard", also: ["emi_jobcard"], group: "ts2", icon: <DashboardIcon /> },
  { key: "ts2_slot_booking", label: "Slot Booking", path: "/emi_slot_booking", group: "ts2", icon: <CalendarMonthSharpIcon /> },
  { key: "ts2_calibration", label: "Calibration", path: "/emi_calibration", group: "ts2", icon: <KitchenIcon /> },

  { key: "nabl_scope", label: "NABL Scope", path: "/nabl_scope", group: "setup", icon: <VerifiedIcon /> },
  { key: "test_types", label: "Test Types", path: "/test_types", group: "setup", icon: <CategoryIcon /> },
  { key: "test_pricing", label: "Test Pricing", path: "/ts1_test_pricing", group: "setup", icon: <CurrencyRupeeIcon /> },
  { key: "chamber_specs", label: "Chamber Specs", path: "/ts1_chamber_specs", group: "setup", icon: <TuneIcon /> },
  { key: "test_durations", label: "Test Durations", path: "/test_durations", group: "setup", icon: <TimerIcon /> },

  {
    key: "projects",
    label: "Project Management",
    path: "/projects",
    also: ["create_project", "edit_project", "tasks", "add_task", "edit_task", "my_tasks"],
    group: "projects",
    icon: <EventRepeatIcon />,
  },

  { key: "user_management", label: "Users & Access", path: "/user_management", group: "admin", icon: <ManageAccountsIcon /> },
];

const BY_SEGMENT = new Map();
for (const item of MENU_ITEMS) {
  BY_SEGMENT.set(item.path.slice(1), item);
  for (const s of item.also || []) BY_SEGMENT.set(s, item);
}

// The menu item a page belongs to ("/quotation/12" → Quotations), or null for pages outside the menu
export const menuItemForPath = (pathname) => BY_SEGMENT.get(String(pathname || "").split("/")[1] || "") || null;

// Item label with its group where the same label is used twice ("Job Cards" in TS1 and TS2)
export const fullLabel = (item) => {
  const twice = MENU_ITEMS.filter((i) => i.label === item.label).length > 1;
  return twice ? `${item.label} (${MENU_GROUPS.find((g) => g.id === item.group)?.label})` : item.label;
};

// Groups left out of the side menu for now. Access rules are kept, and the pages
// still open by their address. Remove "sales" to bring Enquiries & Quotes back.
const HIDDEN_MENU_GROUPS = ["sales"];

// Groups with the items this user may open, the department's own group first
export function visibleMenu(access) {
  const allowed = new Set(access?.menus || []);
  const order = MENU_GROUPS.filter((g) => !HIDDEN_MENU_GROUPS.includes(g.id)).sort((a, b) => (b.id === access?.homeGroup) - (a.id === access?.homeGroup));
  return order
    .map((g) => ({ ...g, items: MENU_ITEMS.filter((i) => i.group === g.id && allowed.has(i.key)) }))
    .filter((g) => g.items.length);
}

// Where to land after login: Home if allowed, else the first page of the department's menu
export const landingPath = (access) =>
  access?.menus?.includes("home") ? "/home" : visibleMenu(access)[0]?.items[0]?.path || null;
