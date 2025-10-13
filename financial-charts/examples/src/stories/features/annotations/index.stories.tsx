
import { Label } from "../../../../../src";
import Annotations from "./Annotations";

export default {
    component: Label,
    title: "Features/Annotations",
    argTypes: {
        fillStyle: { control: "color" },
        text: {
            control: {
                type: "text",
            },
        },
    },
};
export const background = () => <Annotations />;
