/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DurationStats } from './DurationStats';
import type { MinMaxSumCount } from './MinMaxSumCount';
/**
 * Status poll metrics (count, response size, Redis read duration).
 */
export type StatusPollsMetrics = {
    count?: number;
    response_bytes?: (MinMaxSumCount | null);
    redis_read_duration_ms?: (DurationStats | null);
    /**
     * ISO datetimes of each poll (for time-series graphs)
     */
    poll_timestamps?: (Array<string> | null);
};

