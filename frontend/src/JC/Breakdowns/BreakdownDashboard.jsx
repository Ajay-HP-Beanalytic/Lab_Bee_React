import { Grid } from "@mui/material";
import { HBars, PagedTable, Panel, SectionTitle, Shell, Tiles, Trend, hoursText, pctText, useDashboard } from "../Dashboards/dashboardParts";

const rupees = (n) => (n == null ? "–" : `₹${Number(n).toLocaleString("en-IN")}`);

/** Downtime, what fails, what it costs, and which spares to keep */
export default function BreakdownDashboard() {
  const board = useDashboard("/api/ts1/breakdowns/dashboard");
  const d = board.data;
  return (
    <Shell title="Breakdown Dashboard" note="For planning maintenance, procurement and spare parts stock" board={board}>
      {d && (
        <>
          <SectionTitle>Now</SectionTitle>
          <Tiles
            items={[
              { label: "Open breakdowns", value: d.now.open, warn: true },
              { label: "Chambers down", value: d.now.chambers_down, warn: true },
              { label: "Waiting for parts", value: d.now.waiting_parts, warn: true },
              { label: "Longest open", value: hoursText(d.now.oldest_open_hours) },
              { label: "Spares at or below minimum", value: d.now.low_stock, warn: true },
              { label: "Spares out of stock", value: d.now.out_of_stock, warn: true },
            ]}
          />

          <SectionTitle note={`Last ${d.days} days`}>The period</SectionTitle>
          <Tiles
            items={[
              { label: "Breakdowns", value: d.period.breakdowns },
              { label: "Repaired", value: d.period.repaired },
              { label: "Total downtime", value: hoursText(d.period.down_hours) },
              { label: "Average repair time", value: hoursText(d.period.mttr_hours), hint: "MTTR: broke down → repaired" },
              { label: "Chamber availability", value: pctText(d.period.availability), hint: "All chambers together" },
              ...(d.period.costs
                ? [
                    { label: "Parts cost", value: rupees(d.period.costs.parts) },
                    { label: "Labour / service cost", value: rupees(d.period.costs.labour) },
                    { label: "Value of spares in stock", value: rupees(d.period.costs.stock_value) },
                  ]
                : []),
            ]}
          />
          <Grid container spacing={1} mt={0}>
            <Grid item xs={12} md={7}>
              <Panel title="Breakdowns over time">
                <Trend data={d.trend} first="Broke down" second="Repaired" />
              </Panel>
            </Grid>
            <Grid item xs={12} md={5}>
              <Panel title="Downtime by chamber" note="Hours">
                <HBars data={d.down_by_chamber} name="Hours" />
              </Panel>
            </Grid>
            <Grid item xs={12} md={4}>
              <Panel title="Kind of failure">
                <HBars data={d.by_category} name="Breakdowns" />
              </Panel>
            </Grid>
            <Grid item xs={12} md={4}>
              <Panel title="Parts used most" note="Quantity">
                <HBars data={d.top_parts} name="Quantity" />
              </Panel>
            </Grid>
            <Grid item xs={12} md={4}>
              <Panel title="Longest to get" note="Days to get the part">
                <HBars data={d.long_lead} name="Days" />
              </Panel>
            </Grid>
            <Grid item xs={12}>
              <Panel title="Chamber reliability" note="MTBF: average hours running between failures. MTTR: average hours to repair.">
                <PagedTable
                  rows={d.chambers}
                  minWidth={620}
                  rowKey={(c) => c.id}
                  columns={[
                    { label: "Chamber", field: "name" },
                    { label: "Breakdowns", field: "failures", align: "right" },
                    { label: "Downtime", align: "right", render: (c) => hoursText(c.down_hours) },
                    { label: "MTTR", align: "right", render: (c) => hoursText(c.mttr_hours) },
                    { label: "MTBF", align: "right", render: (c) => hoursText(c.mtbf_hours) },
                    { label: "Availability", align: "right", render: (c) => pctText(c.availability) },
                    ...(d.canSeeCost ? [{ label: "Cost", align: "right", render: (c) => rupees(c.cost) }] : []),
                  ]}
                />
              </Panel>
            </Grid>
            <Grid item xs={12} md={7}>
              <Panel title="Spares to keep" note="From parts replaced in the last 12 months: expected use during the lead time (a month if unknown), plus one">
                <PagedTable
                  rows={d.reorder}
                  minWidth={540}
                  rowKey={(r) => r.name}
                  columns={[
                    { label: "Part", render: (r) => `${r.name}${r.listed ? "" : " (not in the spares list)"}` },
                    { label: "Used", field: "used_12m", align: "right" },
                    { label: "Lead days", align: "right", render: (r) => r.lead_days ?? "–" },
                    { label: "In stock", field: "in_hand", align: "right" },
                    { label: "Suggested", field: "suggested", align: "right" },
                    { label: "Short by", field: "short_by", align: "right" },
                  ]}
                />
              </Panel>
            </Grid>
            <Grid item xs={12} md={5}>
              <Panel title="Low stock" note="At or below the minimum">
                <PagedTable
                  rows={d.low_stock}
                  minWidth={380}
                  rowKey={(s) => s.id}
                  columns={[
                    { label: "Part", field: "name" },
                    { label: "In stock", field: "in_hand", align: "right" },
                    { label: "Min", field: "min_qty", align: "right" },
                    { label: "Vendor", field: "vendor" },
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
