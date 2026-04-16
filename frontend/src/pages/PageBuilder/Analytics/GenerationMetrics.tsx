/**
 * Generation Performance Metrics
 *
 * View per-generation metrics (node updates, status polls, Redis timings) and
 * averages across recent runs. Requires RECORD_PERFORMANCE_METRICS=true on backend.
 */

import React, { useState, useMemo } from "react";
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Grid2,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Stack,
  alpha,
  useTheme,
} from "@mui/material";
import {
  Speed,
  Timeline,
  Storage,
  Assessment,
  List as ListIcon,
  CheckCircle,
  Error as ErrorIcon,
} from "@mui/icons-material";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import DashboardLayout from "@/components/PageBuilder/Layouts/DashboardLayout";
import { PageHeader, ModernCard, LoadingState } from "@/components/Shared";
import {
  useGenerationMetricsList,
  useGenerationMetrics,
} from "@/hooks/api/PageBuilder/Analytics/useGenerationMetrics";
import type {
  GenerationPerformanceMetrics,
  NodeUpdatesMetrics,
  NodeDeliveryAttempt,
  NodeReceivedEntry,
  StatusPollsMetrics,
  MinMaxSumCount,
  DurationStats,
} from "@/types/generationMetrics";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`metrics-tabpanel-${index}`}
      aria-labelledby={`metrics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

function formatShortId(id: string): string {
  if (id.length <= 8) return id;
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}

/** Compute averages from list of metrics (exclude null/undefined). */
function computeAverages(list: GenerationPerformanceMetrics[]) {
  const n = list.length;
  if (n === 0) {
    return {
      count: 0,
      avgDurationSeconds: null as number | null,
      avgNodeUpdatesReceived: null as number | null,
      avgStatusPollsCount: null as number | null,
      avgExecutionLogLength: null as number | null,
      completedCount: 0,
      failedCount: 0,
    };
  }
  let sumDuration = 0;
  let countDuration = 0;
  let sumNodeReceived = 0;
  let countNodeReceived = 0;
  let sumPolls = 0;
  let countPolls = 0;
  let sumLogLength = 0;
  let countLogLength = 0;
  let completed = 0;
  let failed = 0;
  for (const m of list) {
    if (typeof m.duration_seconds === "number") {
      sumDuration += m.duration_seconds;
      countDuration++;
    }
    if (m.node_updates != null && typeof m.node_updates.received === "number") {
      sumNodeReceived += m.node_updates.received;
      countNodeReceived++;
    }
    if (m.status_polls != null && typeof m.status_polls.count === "number") {
      sumPolls += m.status_polls.count;
      countPolls++;
    }
    if (typeof m.execution_log_length === "number") {
      sumLogLength += m.execution_log_length;
      countLogLength++;
    }
    if (m.status === "completed") completed++;
    else if (m.status === "failed") failed++;
  }
  return {
    count: n,
    avgDurationSeconds: countDuration ? Math.round((sumDuration / countDuration) * 10) / 10 : null,
    avgNodeUpdatesReceived: countNodeReceived ? Math.round(sumNodeReceived / countNodeReceived) : null,
    avgStatusPollsCount: countPolls ? Math.round((sumPolls / countPolls) * 10) / 10 : null,
    avgExecutionLogLength: countLogLength ? Math.round(sumLogLength / countLogLength) : null,
    completedCount: completed,
    failedCount: failed,
  };
}

const BUCKET_SECONDS = 5;

export type TimeSeriesBucket = {
  second: number;
  redis_writes: number;
  failed_requests: number;
  redis_reads: number;
};

/** Build time-series buckets (per BUCKET_SECONDS) for chart: Redis writes, failed requests, Redis reads. */
function buildTimeSeriesData(m: GenerationPerformanceMetrics): TimeSeriesBucket[] {
  const startedAt = m.started_at;
  if (!startedAt) return [];
  const baseMs = new Date(startedAt).getTime();
  if (Number.isNaN(baseMs)) return [];

  const bucketCounts: Record<number, { redis_writes: number; failed_requests: number; redis_reads: number }> = {};

  const toBucket = (iso: string) => Math.floor((new Date(iso).getTime() - baseMs) / 1000 / BUCKET_SECONDS) * BUCKET_SECONDS;

  for (const r of m.node_updates?.nodes_received ?? []) {
    if (r.received_at) {
      const b = toBucket(r.received_at);
      if (!bucketCounts[b]) bucketCounts[b] = { redis_writes: 0, failed_requests: 0, redis_reads: 0 };
      bucketCounts[b].redis_writes += 1;
    }
  }
  for (const a of m.node_updates?.node_delivery_attempts ?? []) {
    if (a.status === "failed" && a.attempted_at) {
      const b = toBucket(a.attempted_at);
      if (!bucketCounts[b]) bucketCounts[b] = { redis_writes: 0, failed_requests: 0, redis_reads: 0 };
      bucketCounts[b].failed_requests += 1;
    }
  }
  for (const ts of m.status_polls?.poll_timestamps ?? []) {
    const b = toBucket(ts);
    if (!bucketCounts[b]) bucketCounts[b] = { redis_writes: 0, failed_requests: 0, redis_reads: 0 };
    bucketCounts[b].redis_reads += 1;
  }

  const buckets = Object.keys(bucketCounts).map(Number);
  if (buckets.length === 0) return [];
  const maxSecond = Math.max(...buckets, m.duration_seconds ?? 0);
  const out: TimeSeriesBucket[] = [];
  for (let s = 0; s <= maxSecond; s += BUCKET_SECONDS) {
    const c = bucketCounts[s] ?? { redis_writes: 0, failed_requests: 0, redis_reads: 0 };
    out.push({ second: s, redis_writes: c.redis_writes, failed_requests: c.failed_requests, redis_reads: c.redis_reads });
  }
  return out;
}

function MetricsTimeSeriesChart({ data }: { data: TimeSeriesBucket[] }) {
  const theme = useTheme();
  if (!data.length) return null;
  return (
    <Box sx={{ width: "100%", height: 360 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis
            dataKey="second"
            type="number"
            unit="s"
            label={{ value: "Seconds since run start", position: "insideBottom", offset: -8 }}
            tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
            label={{ value: "Count", angle: -90, position: "insideLeft" }}
          />
          <Tooltip
            contentStyle={{ background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` }}
            formatter={(value: number, name: string) => [value, name]}
            labelFormatter={(label) => `t = ${label}s`}
          />
          <Legend />
          <Bar
            yAxisId="left"
            dataKey="redis_writes"
            name="Redis writes"
            fill={theme.palette.primary.main}
            fillOpacity={0.7}
            barSize={8}
          />
          <Bar
            yAxisId="left"
            dataKey="failed_requests"
            name="Failed requests"
            fill={theme.palette.error.main}
            fillOpacity={0.8}
            barSize={8}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="redis_reads"
            name="Redis reads"
            stroke={theme.palette.success.main}
            strokeWidth={2}
            dot={{ r: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Box>
  );
}

function MinMaxSumCard({
  title,
  stat,
  unit = "",
}: {
  title: string;
  stat: MinMaxSumCount | null | undefined;
  unit?: string;
}) {
  if (!stat || stat.count === 0) return null;
  const fmt = (v: number | null | undefined) =>
    v != null ? `${v.toLocaleString()}${unit}` : "—";
  return (
    <Box sx={{ mb: 1 }}>
      <Typography variant="caption" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="body2">
        min {fmt(stat.min)} · max {fmt(stat.max)} · sum {fmt(stat.sum)} · n={stat.count}
      </Typography>
    </Box>
  );
}

function DurationStatsCard({
  title,
  stat,
  unit = "ms",
}: {
  title: string;
  stat: DurationStats | null | undefined;
  unit?: string;
}) {
  if (!stat || stat.count === 0) return null;
  const fmt = (v: number | null | undefined) =>
    v != null ? `${v.toLocaleString()}${unit}` : "—";
  return (
    <Box sx={{ mb: 1 }}>
      <Typography variant="caption" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="body2">
        min {fmt(stat.min)} · max {fmt(stat.max)}
        {stat.p50 != null && ` · p50 ${fmt(stat.p50)}`}
        {stat.p95 != null && ` · p95 ${fmt(stat.p95)}`} · n={stat.count}
      </Typography>
    </Box>
  );
}

const GenerationMetricsPage: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: list, isLoading: listLoading, error: listError } = useGenerationMetricsList(50);
  const { data: single, isLoading: singleLoading } = useGenerationMetrics(selectedId);

  const averages = useMemo(() => computeAverages(list ?? []), [list]);

  const is404 = (listError as any)?.status === 404;

  return (
    <DashboardLayout>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <PageHeader
          title="Generation Performance Metrics"
          subtitle="Node updates, status polls, and Redis timings per run"
          icon={<Speed />}
        />

        {is404 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Performance metrics are not recorded. Enable RECORD_PERFORMANCE_METRICS on the backend
            to see data here.
          </Alert>
        )}

        {!is404 && listError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Failed to load metrics: {(listError as Error).message}
          </Alert>
        )}

        {!is404 && (
          <>
            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
              <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
                <Tab label="Averages (all runs)" id="metrics-tab-0" />
                <Tab label="Single run" id="metrics-tab-1" />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              {listLoading ? (
                <LoadingState message="Loading metrics…" />
              ) : !list?.length ? (
                <Alert severity="info">No metrics yet. Run a generation to see data.</Alert>
              ) : (
                <Grid2 container spacing={3}>
                  <Grid2 size={{ xs: 12, md: 6, lg: 3 }}>
                    <ModernCard title="Runs" icon={<ListIcon />} variant="gradient">
                      <Typography variant="h4">{averages.count}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {averages.completedCount} completed · {averages.failedCount} failed
                      </Typography>
                    </ModernCard>
                  </Grid2>
                  <Grid2 size={{ xs: 12, md: 6, lg: 3 }}>
                    <ModernCard title="Avg duration" icon={<Timeline />} variant="gradient">
                      <Typography variant="h4">
                        {averages.avgDurationSeconds != null
                          ? `${averages.avgDurationSeconds}s`
                          : "—"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total run time
                      </Typography>
                    </ModernCard>
                  </Grid2>
                  <Grid2 size={{ xs: 12, md: 6, lg: 3 }}>
                    <ModernCard title="Avg node updates" icon={<Storage />} variant="gradient">
                      <Typography variant="h4">
                        {averages.avgNodeUpdatesReceived ?? "—"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Received per run
                      </Typography>
                    </ModernCard>
                  </Grid2>
                  <Grid2 size={{ xs: 12, md: 6, lg: 3 }}>
                    <ModernCard title="Avg status polls" icon={<Assessment />} variant="gradient">
                      <Typography variant="h4">
                        {averages.avgStatusPollsCount ?? "—"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Polls per run
                      </Typography>
                    </ModernCard>
                  </Grid2>

                  <Grid2 size={{ xs: 12 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Recent runs (click to view single run)
                        </Typography>
                        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 320 }}>
                          <Table size="small" stickyHeader>
                            <TableHead>
                              <TableRow>
                                <TableCell>Version ID</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Duration (s)</TableCell>
                                <TableCell align="right">Node updates</TableCell>
                                <TableCell align="right">Status polls</TableCell>
                                <TableCell>Recorded</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {(list ?? []).map((m) => (
                                <TableRow
                                  key={m.generation_version_id}
                                  hover
                                  onClick={() => {
                                    setSelectedId(m.generation_version_id);
                                    setTabValue(1);
                                  }}
                                  sx={{
                                    cursor: "pointer",
                                    bgcolor:
                                      selectedId === m.generation_version_id
                                        ? alpha(theme.palette.primary.main, 0.08)
                                        : undefined,
                                  }}
                                >
                                  <TableCell>
                                    <Typography variant="body2" fontFamily="monospace">
                                      {formatShortId(m.generation_version_id)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      size="small"
                                      label={m.status}
                                      color={m.status === "completed" ? "success" : "error"}
                                      icon={
                                        m.status === "completed" ? (
                                          <CheckCircle fontSize="small" />
                                        ) : (
                                          <ErrorIcon fontSize="small" />
                                        )
                                      }
                                    />
                                  </TableCell>
                                  <TableCell align="right">
                                    {m.duration_seconds != null ? m.duration_seconds : "—"}
                                  </TableCell>
                                  <TableCell align="right">
                                    {m.node_updates?.received ?? "—"}
                                  </TableCell>
                                  <TableCell align="right">
                                    {m.status_polls?.count ?? "—"}
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="caption">
                                      {formatDate(m.recorded_at)}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid2>
                </Grid2>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {!selectedId ? (
                <Alert severity="info">
                  Select a run from the &quot;Averages (all runs)&quot; table, or run a generation
                  and return here after it completes.
                </Alert>
              ) : singleLoading ? (
                <LoadingState message="Loading run metrics…" />
              ) : single ? (
                <Grid2 container spacing={3}>
                  <Grid2 size={{ xs: 12 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                          <Typography variant="h6">Run</Typography>
                          <Chip
                            size="small"
                            label={single.status}
                            color={single.status === "completed" ? "success" : "error"}
                          />
                          <Typography variant="body2" fontFamily="monospace">
                            {single.generation_version_id}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Recorded: {formatDate(single.recorded_at)}
                          </Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Started: {formatDate(single.started_at)} · Completed:{" "}
                          {formatDate(single.completed_at)}
                          {single.duration_seconds != null &&
                            ` · Duration: ${single.duration_seconds}s`}
                        </Typography>
                        {single.execution_log_length != null && (
                          <Typography variant="body2" color="text.secondary">
                            Execution log entries: {single.execution_log_length}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid2>

                  {single.node_updates && (
                    <Grid2 size={{ xs: 12, md: 6 }}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>
                            Node updates
                          </Typography>
                          <NodeUpdatesSection metrics={single.node_updates} />
                        </CardContent>
                      </Card>
                    </Grid2>
                  )}

                  {single.node_updates &&
                    (single.node_updates.node_delivery_attempts?.length ?? 0) > 0 && (
                      <Grid2 size={{ xs: 12 }}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle1" gutterBottom>
                              Node delivery details
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              Per-node status and timings: which nodes sent successfully and which
                              failed, plus main-app payload size and Redis write time.
                            </Typography>
                            <NodeDeliveryTable
                              attempts={single.node_updates.node_delivery_attempts ?? []}
                              received={single.node_updates.nodes_received ?? []}
                            />
                          </CardContent>
                        </Card>
                      </Grid2>
                    )}

                  {(() => {
                    const timeSeriesData = buildTimeSeriesData(single);
                    if (timeSeriesData.length === 0) return null;
                    return (
                      <Grid2 size={{ xs: 12 }}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle1" gutterBottom>
                              Requests over time
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              Redis writes (blue), failed requests (red), and Redis reads (green) per {BUCKET_SECONDS}s bucket. Correlate failures with load.
                            </Typography>
                            <MetricsTimeSeriesChart data={timeSeriesData} />
                          </CardContent>
                        </Card>
                      </Grid2>
                    );
                  })()}

                  {single.status_polls && (
                    <Grid2 size={{ xs: 12, md: 6 }}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>
                            Status polls
                          </Typography>
                          <StatusPollsSection metrics={single.status_polls} />
                        </CardContent>
                      </Card>
                    </Grid2>
                  )}
                </Grid2>
              ) : (
                <Alert severity="warning">Metrics not found for this run.</Alert>
              )}
            </TabPanel>
          </>
        )}
      </Container>
    </DashboardLayout>
  );
};

function NodeDeliveryTable({
  attempts,
  received,
}: {
  attempts: NodeDeliveryAttempt[];
  received: NodeReceivedEntry[];
}) {
  const theme = useTheme();
  const receivedByNode = useMemo(() => {
    const m: Record<string, NodeReceivedEntry> = {};
    for (const r of received) m[r.node_name] = r;
    return m;
  }, [received]);

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 420 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>Node</TableCell>
            <TableCell>Delivery</TableCell>
            <TableCell align="right">Orch. duration (ms)</TableCell>
            <TableCell align="right">Payload (bytes)</TableCell>
            <TableCell align="right">Redis write (ms)</TableCell>
            <TableCell>Error</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {attempts.map((a, idx) => {
            const rec = receivedByNode[a.node_name];
            return (
              <TableRow
                key={`${a.node_name}-${idx}`}
                sx={{
                  bgcolor:
                    a.status === "failed"
                      ? alpha(theme.palette.error.main, 0.06)
                      : undefined,
                }}
              >
                <TableCell>{idx + 1}</TableCell>
                <TableCell>
                  <Typography variant="body2" fontFamily="monospace">
                    {a.node_name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={a.status}
                    color={a.status === "success" ? "success" : "error"}
                    icon={
                      a.status === "success" ? (
                        <CheckCircle fontSize="small" />
                      ) : (
                        <ErrorIcon fontSize="small" />
                      )
                    }
                  />
                </TableCell>
                <TableCell align="right">
                  {a.duration_ms != null ? a.duration_ms : "—"}
                </TableCell>
                <TableCell align="right">
                  {rec?.payload_bytes != null ? rec.payload_bytes : "—"}
                </TableCell>
                <TableCell align="right">
                  {rec?.redis_write_ms != null ? rec.redis_write_ms : "—"}
                </TableCell>
                <TableCell>
                  {a.status === "failed" && a.error_type ? (
                    <Typography variant="caption" color="error">
                      {a.error_type}
                    </Typography>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function NodeUpdatesSection({ metrics }: { metrics: NodeUpdatesMetrics }) {
  return (
    <Stack spacing={1}>
      <Typography variant="body2">
        Attempted: {metrics.attempted ?? "—"} · Failed: {metrics.failed ?? "—"} · Received:{" "}
        {metrics.received}
      </Typography>
      {metrics.failed_reasons && Object.keys(metrics.failed_reasons).length > 0 && (
        <Box>
          <Typography variant="caption" color="text.secondary">
            Failed reasons
          </Typography>
          <pre style={{ margin: "4px 0 0", fontSize: 12 }}>
            {JSON.stringify(metrics.failed_reasons, null, 2)}
          </pre>
        </Box>
      )}
      <MinMaxSumCard title="Payload size (bytes)" stat={metrics.payload_bytes} />
      <DurationStatsCard
        title="Redis write duration (ms)"
        stat={metrics.redis_write_duration_ms}
      />
    </Stack>
  );
}

function StatusPollsSection({ metrics }: { metrics: StatusPollsMetrics }) {
  return (
    <Stack spacing={1}>
      <Typography variant="body2">Count: {metrics.count}</Typography>
      <MinMaxSumCard title="Response size (bytes)" stat={metrics.response_bytes} />
      <DurationStatsCard
        title="Redis read duration (ms)"
        stat={metrics.redis_read_duration_ms}
      />
    </Stack>
  );
}

export default GenerationMetricsPage;
