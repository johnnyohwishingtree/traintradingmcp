import { OHLCSeries } from "../../../../../src";
import { Daily, Intraday } from "./BasicOHLCSeries";

export default {
    component: OHLCSeries,
    title: "Visualization/Series/OHLC",
};

export const daily = () => <Daily />;

export const intraday = () => <Intraday />;
