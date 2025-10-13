import { BollingerSeries, BollingerSeriesProps } from "../../../../../src";
import BollingerIndicator from "./BollingerIndicator";

export default {
    title: "Visualization/Indicator/Bollinger Band",
    component: BollingerSeries,
    argTypes: {
        fillStyle: { control: "color" },
        strokeStyle: { control: null },
    },
};

export const basic = () => <BollingerIndicator />;
