import { KagiSeries } from "../../../../../src";
import { Daily, Intraday } from "./BasicKagiSeries";

export default {
    component: KagiSeries,
    title: "Visualization/Series/Kagi",
};

export const daily = () => <Daily />;

export const intraday = () => <Intraday />;
