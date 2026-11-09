import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { Grid } from "@mui/material";
import { HBars, PagedTable, Panel, SectionTitle, Shell, Tiles, Trend, daysText, useDashboard } from "./dashboardParts";

const when = (d) => (d ? dayjs(d).format("DD MMM, HH:mm") : "–");

// Test groups: name, tests, job cards, hours
const groupColumns = (label) => [
  { label, field: "name" },
  { label: "Tests", field: "tests", align: "right" },
  { label: "Job cards", field: "jobcards", align: "right" },
  { label: "Hours", field: "hours", align: "right" },
];

/** TS1 job cards dashboard: today, what is running and open, and how the period went */
export default function JobCardsInsights() {
  const navigate = useNavigate();
  const board = useDashboard("/api/ts1/dashboards/jobcards");
  const d = board.data;
  const openJc = (id) => navigate("/jobcard_dashboard", { state: { openJcId: id } });

  return (
    <Shell title="JC Dashboard" note="TS1 job cards and tests: workload, progress and turnaround" backTo="/jobcard_dashboard" backLabel="Job cards" board={board}>
      {d && (
        <>
          <SectionTitle note="Job cards have dates only, so they are counted for today; tests for the last 24 hours">Today and last 24 hours</SectionTitle>
          <Tiles
            items={[
              { label: "Job cards opened today", value: d.last24.opened_today },
              { label: "Job cards closed today", value: d.last24.closed_today },
              { label: "Tests started (24 h)", value: d.last24.tests_started },
              { label: "Tests ended (24 h)", value: d.last24.tests_ended },
              { label: "Tests ending in next 24 h", value: d.last24.tests_ending_next },
            ]}
          />

          <SectionTitle>Now</SectionTitle>
          <Tiles
            items={[
              { label: "Open job cards", value: d.now.open, hint: "Not closed yet", onClick: () => navigate("/jobcard_dashboard") },
              { label: "Status Open", value: d.now.status_open },
              { label: "Status Running", value: d.now.status_running },
              { label: "Status Test Completed", value: d.now.status_completed },
              { label: "Tests running", value: d.now.running_tests, hint: "Started, not ended, job card not closed" },
              { label: "Chambers in use", value: d.now.chambers_busy },
              { label: "Tests all ended, JC open", value: d.now.ready_to_close, warn: true, hint: "Every test has ended but the job card isn't closed" },
              { label: "Open over 30 days", value: d.now.over_30_days, warn: true },
            ]}
          />
          <Grid container spacing={1} mt={0}>
            <Grid item xs={12} md={4}>
              <Panel title="Open job cards by age">
                <HBars data={d.now.ageing} name="Job cards" />
              </Panel>
            </Grid>
            <Grid item xs={12} md={8}>
              <Panel title="Tests running now" note="Oldest first. Click to open the job card">
                <PagedTable
                  rows={d.running}
                  minWidth={640}
                  rowKey={(t) => `${t.jcNumber}-${t.test}-${t.startDate}`}
                  onRowClick={(t) => openJc(t.jcId)}
                  columns={[
                    { label: "JC", field: "jcNumber" },
                    { label: "Test", field: "test" },
                    { label: "Chamber", field: "chamber" },
                    { label: "Started by", field: "startedBy" },
                    { label: "Started", render: (t) => when(t.startDate) },
                    { label: "Ends", render: (t) => when(t.endDate) },
                  ]}
                />
              </Panel>
            </Grid>
          </Grid>

          <SectionTitle note={`Last ${d.days} days`}>The period</SectionTitle>
          <Tiles
            items={[
              { label: "Job cards opened", value: d.period.opened },
              { label: "Job cards closed", value: d.period.closed },
              { label: "Tests started", value: d.period.tests },
              { label: "Test hours", value: d.period.test_hours },
              { label: "Customers", value: d.period.customers },
              { label: "Open → closed", value: daysText(d.period.median_days_to_close), hint: "Median" },
              { label: "Item received → first test", value: daysText(d.period.median_days_to_first_test), hint: "Median waiting time" },
              { label: "Last test end → closed", value: daysText(d.period.median_days_test_end_to_close), hint: "Median" },
            ]}
          />
          <Grid container spacing={1} mt={0}>
            <Grid item xs={12} md={7}>
              <Panel title="Opened and closed">
                <Trend data={d.trend} first="Opened" second="Closed" />
              </Panel>
            </Grid>
            <Grid item xs={12} md={5}>
              <Panel title="Chamber hours" note="Hours of tests started in the period">
                <HBars data={d.chambers} dataKey="hours" name="Hours" />
              </Panel>
            </Grid>
            <Grid item xs={12} md={4}>
              <Panel title="Tests by category">
                <HBars data={d.categories} name="Tests" />
              </Panel>
            </Grid>
            <Grid item xs={12} md={4}>
              <Panel title="Type of request">
                <HBars data={d.period.request_types} name="Job cards" />
              </Panel>
            </Grid>
            <Grid item xs={12} md={4}>
              <Panel title="Report type">
                <HBars data={d.period.report_types} name="Job cards" />
              </Panel>
            </Grid>
            <Grid item xs={12} md={6}>
              <Panel title="Customers">
                <PagedTable rows={d.customers} minWidth={340} rowKey={(r) => r.name} columns={groupColumns("Customer")} />
              </Panel>
            </Grid>
            <Grid item xs={12} md={6}>
              <Panel title="Tests run">
                <PagedTable rows={d.test_names} minWidth={340} rowKey={(r) => r.name} columns={groupColumns("Test")} />
              </Panel>
            </Grid>
            <Grid item xs={12} md={5}>
              <Panel title="Test engineers">
                <PagedTable
                  rows={d.engineers}
                  minWidth={280}
                  rowKey={(p) => p.name}
                  columns={[
                    { label: "Person", field: "name" },
                    { label: "Started", field: "started", align: "right" },
                    { label: "Ended", field: "ended", align: "right" },
                  ]}
                />
              </Panel>
            </Grid>
            <Grid item xs={12} md={7}>
              <Panel title="Oldest open job cards" note="Click to open the job card">
                <PagedTable
                  rows={d.oldest}
                  minWidth={480}
                  rowKey={(j) => j.id}
                  onRowClick={(j) => openJc(j.id)}
                  columns={[
                    { label: "JC", field: "jcNumber" },
                    { label: "Customer", field: "company" },
                    { label: "Status", field: "status" },
                    { label: "Tests ended", align: "right", render: (j) => `${j.ended}/${j.tests}` },
                    { label: "Days open", field: "days", align: "right" },
                  ]}
                />
              </Panel>
            </Grid>
          </Grid>
        </>
      )}
    </Shell>
  );
}
