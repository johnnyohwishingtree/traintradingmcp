import { AreaSeries } from "../../../../../src";
import { Daily, Intraday } from "./BasicAreaSeries";

export default {
    title: "Visualization/Series/Area",
    component: AreaSeries,
    argTypes: {
        fillStyle: { control: "color" },
        strokeStyle: { control: "color" },
    },
};

export const daily = () => <Daily />;

export const intraday = () => <Intraday />;
