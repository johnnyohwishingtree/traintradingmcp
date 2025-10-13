import { scaleLog, scaleUtc } from "d3-scale";
import { Daily } from "./Scales";

export default {
    title: "Features/Scales",
};

export const continuousScale = () => <Daily />;

export const utcScale = () => <Daily xScale={scaleUtc()} />;

export const logScale = () => <Daily yScale={scaleLog()} />;
