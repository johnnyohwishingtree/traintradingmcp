import { CandlestickSeries } from "../../../../../src";
import { Daily, Intraday } from "./BasicCandlestick";

export default {
    component: CandlestickSeries,
    title: "Visualization/Series/Candles",
};

export const daily = () => <Daily />;

export const intraday = () => <Intraday />;
