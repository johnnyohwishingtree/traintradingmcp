
import { YAxis, YAxisProps } from "../../../../../src";
import AxisExample from "./Axis";

export default {
    component: YAxis,
    title: "Features/Axis",
    argTypes: {
        axisAt: {
            control: {
                type: "select",
                options: ["left", "right", "middle"],
            },
        },
        gridLinesStrokeStyle: { control: "color" },
        strokeStyle: { control: "color" },
        tickLabelFill: { control: "color" },
        tickStrokeStyle: { control: "color" },
    },
};
export const yAxis = () => <AxisExample />;
