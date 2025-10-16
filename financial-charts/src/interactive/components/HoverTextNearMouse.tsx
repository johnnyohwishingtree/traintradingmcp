import * as React from "react";
import { isDefined, GenericChartComponent } from "../../core";

const PADDING = 10;
const MIN_WIDTH = PADDING;

export interface HoverTextNearMouseProps {
    readonly fontFamily?: string;
    readonly fontSize?: number;
    readonly fill?: string;
    readonly text?: string;
    readonly bgFill?: string;
    readonly bgOpacity?: number;
    readonly bgWidth: number | string;
    readonly bgHeight: number | string;
    readonly show: boolean;
}

interface HoverTextNearMouseState {
    textHeight?: number;
    textWidth?: number;
}

export class HoverTextNearMouse extends React.Component<HoverTextNearMouseProps, HoverTextNearMouseState> {
    public static defaultProps = {
        fontFamily: "-apple-system, system-ui, Roboto, 'Helvetica Neue', Ubuntu, sans-serif",
        fontSize: 12,
        fill: "#000000",
        bgFill: "#FA9325",
        bgOpacity: 0.5,
    };

    private readonly textNode = React.createRef<SVGTextElement>();

    public constructor(props: HoverTextNearMouseProps) {
        super(props);

        this.state = {
            textWidth: undefined,
            textHeight: undefined,
        };
    }

    public componentDidMount() {
        this.updateTextSize();
    }

    public componentDidUpdate(prevProps: HoverTextNearMouseProps) {
        // Only update text size if relevant props changed to prevent infinite loops
        if (
            prevProps.text !== this.props.text ||
            prevProps.fontSize !== this.props.fontSize ||
            prevProps.fontFamily !== this.props.fontFamily ||
            prevProps.bgWidth !== this.props.bgWidth ||
            prevProps.bgHeight !== this.props.bgHeight
        ) {
            this.updateTextSize();
        }
    }

    public render() {
        const { text } = this.props;
        if (text) {
            return <GenericChartComponent svgDraw={this.renderSVG} drawOn={["mousemove"]} />;
        } else {
            return null;
        }
    }

    private readonly renderSVG = (moreProps: any) => {
        const { fontFamily, fontSize, fill, bgFill, bgOpacity } = this.props;

        const textMetaData = helper(
            {
                ...this.props,
                bgWidth: this.getBgWidth(),
                bgHeight: this.getBgHeight(),
            },
            moreProps,
        );

        if (textMetaData !== undefined && isDefined(textMetaData)) {
            const { rect, text } = textMetaData;
            return (
                <g>
                    <rect fill={bgFill} fillOpacity={bgOpacity} stroke={bgFill} {...rect} />
                    <text
                        ref={this.textNode}
                        fontSize={fontSize}
                        fontFamily={fontFamily}
                        textAnchor="start"
                        alignmentBaseline={"central"}
                        fill={fill}
                        x={text.x}
                        y={text.y}
                    >
                        {text.text}
                    </text>
                </g>
            );
        }

        return null;
    };

    private readonly getBgHeight = () => {
        const { bgHeight } = this.props;
        const { textHeight } = this.state;

        if (bgHeight !== "auto") {
            return bgHeight;
        } else if (textHeight !== undefined) {
            return textHeight + PADDING;
        } else {
            return MIN_WIDTH;
        }
    };

    private readonly getBgWidth = () => {
        const { bgWidth } = this.props;
        const { textWidth } = this.state;

        if (bgWidth !== "auto") {
            return bgWidth;
        } else if (textWidth !== undefined) {
            return textWidth + PADDING;
        } else {
            return MIN_WIDTH;
        }
    };

    private readonly updateTextSize = () => {
        const { bgWidth, bgHeight } = this.props;
        if (bgWidth === "auto" || bgHeight === "auto") {
            const textNode = this.textNode.current;
            if (textNode !== null) {
                try {
                    const { width, height } = textNode.getBBox();
                    // Add tolerance to prevent micro-differences from causing updates
                    const tolerance = 0.1;
                    const widthChanged = Math.abs((this.state.textWidth || 0) - width) > tolerance;
                    const heightChanged = Math.abs((this.state.textHeight || 0) - height) > tolerance;

                    if (widthChanged || heightChanged) {
                        this.setState({
                            textWidth: width,
                            textHeight: height,
                        });
                    }
                } catch (error) {
                    // getBBox can fail in some edge cases, ignore silently
                }
            }
        }
    };
}

function helper(props: any, moreProps: any) {
    const { show, bgWidth, bgHeight } = props;

    const {
        mouseXY,
        chartConfig: { height, width },
        show: mouseInsideCanvas,
    } = moreProps;

    if (show && mouseInsideCanvas) {
        const [x, y] = mouseXY;

        const cx = x < width / 2 ? x + PADDING : x - bgWidth - PADDING;

        const cy = y < height / 2 ? y + PADDING : y - bgHeight - PADDING;

        const rect = {
            x: cx,
            y: cy,
            width: bgWidth,
            height: bgHeight,
        };

        const text = {
            text: props.text,
            x: cx + PADDING / 2,
            y: cy + bgHeight / 2,
        };

        return {
            rect,
            text,
        };
    }
}
