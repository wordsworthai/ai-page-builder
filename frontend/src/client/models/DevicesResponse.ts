/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DateRange } from './DateRange';
import type { DeviceData } from './DeviceData';
/**
 * Response for GET /analytics/website/{website_id}/devices
 */
export type DevicesResponse = {
    /**
     * Website UUID
     */
    website_id: string;
    /**
     * Website subdomain
     */
    subdomain: string;
    date_range: DateRange;
    /**
     * Devices sorted by pageviews
     */
    devices: Array<DeviceData>;
    /**
     * Total number of device types
     */
    total_device_types: number;
};

