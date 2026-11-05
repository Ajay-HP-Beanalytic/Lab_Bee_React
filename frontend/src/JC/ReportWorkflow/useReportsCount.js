import { useEffect, useState } from "react";
import axios from "axios";
import { serverBaseAddress } from "../../Pages/APIPage";

/** Reports waiting on this user (badge on the Reports menu), refreshed every 2 minutes and after changes */
export default function useReportsCount(enabled) {
  const [count, setCount] = useState({ count: 0, overdue: 0 });
  useEffect(() => {
    if (!enabled) return undefined;
    let live = true;
    const load = () =>
      axios
        .get(`${serverBaseAddress}/api/ts1/reports/my-count`)
        .then((r) => live && setCount(r.data))
        .catch(() => {});
    load();
    const timer = setInterval(load, 2 * 60 * 1000);
    window.addEventListener("ts1-reports-changed", load);
    window.addEventListener("ts1-report-notification", load);
    return () => {
      live = false;
      clearInterval(timer);
      window.removeEventListener("ts1-reports-changed", load);
      window.removeEventListener("ts1-report-notification", load);
    };
  }, [enabled]);
  return count;
}
