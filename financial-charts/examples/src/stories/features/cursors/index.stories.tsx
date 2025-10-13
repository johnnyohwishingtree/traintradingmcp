import { Cursor, CursorProps } from "../../../../../src";
import Cursors from "./Cursors";

export default {
    component: Cursor,
    title: "Features/Cursors",
    argTypes: {
        strokeStyle: { control: "color" },
        xCursorShapeFillStyle: { control: "color" },
        xCursorShapeStrokeStyle: { control: "color" },
    },
};

export const cursor = () => <Cursors />;

export const crosshair = () => <Cursors crosshair />;
