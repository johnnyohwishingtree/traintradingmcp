import { AlternatingFillAreaSeries } from "../../../../../src";
import { Daily, Intraday } from "./BasicBaselineSeries";

export default {
    component: AlternatingFillAreaSeries,
    title: "Visualization/Series/Baseline",
    args: {
        fillStyle: undefined,
        strokeStyle: undefined,
    },
    argTypes: {
        baseAt: { control: "number" },
        fillStyle: { control: "object" },
        strokeStyle: { control: "object" },
    },
};

export const daily = () => <Daily />;

export const intraday = () => <Intraday />;
