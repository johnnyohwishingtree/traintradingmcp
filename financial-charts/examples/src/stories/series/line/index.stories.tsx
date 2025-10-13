import { LineSeries } from "../../../../../src";
import { Daily, Intraday } from "./BasicLineSeries";

export default {
    component: LineSeries,
    title: "Visualization/Series/Line",
    argTypes: {
        strokeStyle: { control: "color" },
    },
};

export const daily = <Daily />;

export const intraday = <Intraday />;
