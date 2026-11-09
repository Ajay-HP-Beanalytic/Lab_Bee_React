import { useNavigate } from "react-router-dom";
import { Chip, Grid } from "@mui/material";
import { HBars, PagedTable, Panel, SectionTitle, Shell, Tiles, Trend, hoursText, pctText, useDashboard } from "./dashboardParts";

/** TS1 Reports dashboard: the last 24 hours, what is pending now, and how the period went */
export default function ReportsInsights() {
  const navigate = useNavigate();
  const board = useDashboard("/api/ts1/dashboards/reports");
  const d = board.data;
  const toBoard = () => navigate("/ts1_reports");

  return (
    <Shell title="Reports Dashboard" note="TS1 test reports: what went out, what is pending and how long it takes" backTo="/ts1_reports" backLabel="Reports" board={board}>
      {d && (
        <>
          <SectionTitle note="Whatever the period chosen above">Last 24 hours</SectionTitle>
          <Tiles
            items={[
              { label: "Reports sent to customers", value: d.last24.sent, hint: `${d.last24.drafts_sent} draft(s) and ${d.last24.finals_sent} final(s)` },
              { label: "Final reports issued", value: d.last24.finals_issued },
              { label: "Drafts made", value: d.last24.drafts_made },
              { label: "Reviewed", value: d.last24.reviewed },
              { label: "Returned by reviewer", value: d.last24.returned },
              { label: "Customer accepted", value: d.last24.accepted },
              { label: "Tests ended (new reports)", value: d.last24.tests_ended },
              { label: "Became pending in 24 h", value: d.last24.new_pending, hint: "With the lab, reached their present stage in the last 24 hours", onClick: toBoard },
              { label: "Pending over 24 h", value: d.last24.pending_over_24, warn: true, hint: "With the lab, at their present stage for more than 24 hours", onClick: toBoard },
            ]}
          />

          <SectionTitle>Pending now</SectionTitle>
          <Tiles
            items={[
              { label: "All pending", value: d.now.open, onClick: toBoard },
              { label: "Overdue", value: d.now.overdue, warn: true, hint: "Past the days set in Reports > Settings", onClick: toBoard },
              { label: "To prepare", value: d.now.to_prepare, hint: "Test ended, no report yet" },
              { label: "In review", value: d.now.in_review },
              { label: "With the customer", value: d.now.with_customer },
              { label: "Waiting for Accounts", value: d.now.waiting_accounts },
              { label: "On hold", value: d.now.on_hold, hint: "Report Delivery Status is Hold Report" },
            ]}
          />
          <Grid container spacing={1} mt={0}>
            <Grid item xs={12} md={4}>
              <Panel title="By stage">
                <HBars data={d.now.by_stage} name="Reports" />
              </Panel>
            </Grid>
            <Grid item xs={12} md={4}>
              <Panel title="Waiting on">
                <HBars data={d.now.by_wait} name="Reports" />
              </Panel>
            </Grid>
            <Grid item xs={12} md={4}>
              <Panel title="How long at this stage" note="With the lab only">
                <HBars data={d.now.ageing} name="Reports" />
              </Panel>
            </Grid>
          </Grid>

          <SectionTitle note={`Last ${d.days} days`}>The period</SectionTitle>
          <Tiles
            items={[
              { label: "Drafts sent", value: d.period.drafts_sent },
              { label: "Finals issued", value: d.period.finals_issued },
              { label: "Draft sent on time", value: pctText(d.period.on_time_pct), hint: `First draft sent within ${d.period.allowed_days} days of the test ending` },
              { label: "Returned by reviewer", value: pctText(d.period.return_pct), hint: "Share of reviewed reports returned at least once" },
              { label: "Customer asked for changes", value: pctText(d.period.changes_pct), hint: "Share of drafts sent" },
              { label: "Reviews skipped", value: d.period.review_skipped },
              { label: "Test end → draft made", value: hoursText(d.period.median_hours.prepare), hint: "Median" },
              { label: "Review time", value: hoursText(d.period.median_hours.review), hint: "Median, sent for review → approved" },
              { label: "Reviewed → sent", value: hoursText(d.period.median_hours.send), hint: "Median" },
              { label: "Customer reply time", value: hoursText(d.period.median_hours.customer), hint: "Median, draft sent → accepted" },
              { label: "Test end → final issued", value: hoursText(d.period.median_hours.total), hint: "Median" },
            ]}
          />
          <Grid container spacing={1} mt={0}>
            <Grid item xs={12} md={7}>
              <Panel title="Sent over time">
                <Trend data={d.trend} first="Drafts sent" second="Finals issued" />
              </Panel>
            </Grid>
            <Grid item xs={12} md={5}>
              <Panel title="Who did what">
                <PagedTable
                  rows={d.people}
                  minWidth={320}
                  perPage={5}
                  rowKey={(p) => p.name}
                  columns={[
                    { label: "Person", field: "name" },
                    { label: "Drafts", field: "drafts", align: "right" },
                    { label: "Reviews", field: "reviews", align: "right" },
                    { label: "Sent", field: "sent", align: "right" },
                  ]}
                />
              </Panel>
            </Grid>
          </Grid>

          <SectionTitle note="Click a report to open it">Needs attention</SectionTitle>
          <Grid container spacing={1}>
            <Grid item xs={12} md={8}>
              <Panel title="Longest pending with the lab">
                <PagedTable
                  rows={d.oldest}
                  minWidth={640}
                  rowKey={(r) => r.testDetailId}
                  onRowClick={(r) => navigate(`/ts1_reports?open=${r.testDetailId}`)}
                  columns={[
                    { label: "JC", field: "jcNumber" },
                    { label: "Customer", field: "company" },
                    { label: "Test", field: "testName" },
                    { label: "Stage", field: "stage" },
                    { label: "Waiting on", field: "waits" },
                    { label: "Days", align: "right", render: (r) => (r.overdue ? <Chip size="small" color="error" label={`${r.days} · overdue`} /> : r.days) },
                  ]}
                />
              </Panel>
            </Grid>
            <Grid item xs={12} md={4}>
              <Panel title="Pending by customer">
                <PagedTable
                  rows={d.customers}
                  minWidth={260}
                  rowKey={(c) => c.company}
                  columns={[
                    { label: "Customer", field: "company" },
                    { label: "Pending", field: "pending", align: "right" },
                    { label: "Overdue", field: "overdue", align: "right" },
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
