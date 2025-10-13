import { MACDSeries } from "../../../../../src";
import MACDIndicator from "./MacdIndicator";

export default {
    title: "Visualization/Indicator/MACD",
    component: MACDSeries,
};

export const basic = () => <MACDIndicator />;
