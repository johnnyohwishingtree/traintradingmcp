import { BarSeries } from "../../../../../src";
import { Daily, Intraday } from "./BasicBarSeries";

export default {
    component: BarSeries,
    title: "Visualization/Series/Bar",
    argTypes: {
        fillStyle: { control: "color" },
    },
};

export const daily = () => <Daily />;

export const intraday = () => <Intraday />;
