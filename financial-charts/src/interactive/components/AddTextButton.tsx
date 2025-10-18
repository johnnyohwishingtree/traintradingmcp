import * as React from "react";
import { GenericChartComponent } from "../../core";
import { debugLog, debugWarn, debugState } from "../../debug";

export interface AddTextButtonProps {
    /** Whether to show the button */
    readonly show: boolean;
    /** X position in data coordinates */
    readonly cx: number;
    /** Y position in data coordinates */
    readonly cy: number;
    /** Callback when button is clicked */
    readonly onClick?: (e: React.MouseEvent, moreProps: any) => void;
    /** Button fill color */
    readonly fillStyle?: string;
    /** Button text color */
    readonly textFill?: string;
}

/**
 * SVG-based "Add text" button that appears above selected components
 * Uses SVG rendering to persist on screen without needing redraw triggers
 */
export class AddTextButton extends React.Component<AddTextButtonProps> {
    public static defaultProps = {
        fillStyle: "#26a69a",
        textFill: "#FFFFFF",
        show: false,
    };

    public render() {
        const { show, onClick, fillStyle, textFill, cx, cy } = this.props;

        debugLog('AddTextButton', 'render', {
            show,
            cx,
            cy,
            hasOnClick: !!onClick,
            fillStyle,
            textFill
        });

        if (!show) {
            debugLog('AddTextButton', 'render:hidden', { reason: 'show=false' });
            return null;
        }

        if (!onClick) {
            debugWarn('AddTextButton', 'Rendering with show=true but no onClick handler!');
        }

        debugLog('AddTextButton', 'render:visible', { position: [cx, cy] });
        return (
            <GenericChartComponent
                selected
                isHover={this.isHover}
                onClick={this.handleClick}
                svgDraw={({ xScale, chartConfig: { yScale } }: any) => {
                    const x = xScale(cx);
                    const y = yScale(cy);

                    const buttonWidth = 80;
                    const buttonHeight = 24;
                    const buttonRadius = 12;
                    const offsetY = -40;

                    const buttonX = x - buttonWidth / 2;
                    const buttonY = y + offsetY;

                    return (
                        <g>
                            {/* Connecting line */}
                            <line
                                x1={x}
                                y1={y}
                                x2={x}
                                y2={buttonY + buttonHeight}
                                stroke={fillStyle}
                                strokeWidth={2}
                                opacity={0.3}
                            />
                            {/* Button background */}
                            <rect
                                x={buttonX}
                                y={buttonY}
                                width={buttonWidth}
                                height={buttonHeight}
                                rx={buttonRadius}
                                ry={buttonRadius}
                                fill={fillStyle}
                                style={{
                                    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))',
                                    cursor: 'pointer'
                                }}
                            />
                            {/* Button text */}
                            <text
                                x={buttonX + 16}
                                y={buttonY + 17}
                                fill={textFill}
                                fontSize="14px"
                                fontWeight="600"
                                fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                                style={{ pointerEvents: 'none' }}
                            >
                                T+
                            </text>
                            <text
                                x={buttonX + 36}
                                y={buttonY + 16}
                                fill={textFill}
                                fontSize="12px"
                                fontWeight="500"
                                fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                                style={{ pointerEvents: 'none' }}
                            >
                                Add text
                            </text>
                        </g>
                    );
                }}
                drawOn={["pan"]}
            />
        );
    }

    private readonly isHover = (moreProps: any) => {
        const { cx, cy } = this.props;
        const { mouseXY, xScale, chartConfig: { yScale } } = moreProps;

        // Convert data coordinates to screen coordinates
        const x = xScale(cx);
        const y = yScale(cy);

        // Check if mouse is over the button area
        const buttonWidth = 80;
        const buttonHeight = 24;
        const offsetY = -40;

        const buttonX = x - buttonWidth / 2;
        const buttonY = y + offsetY;

        const [mx, my] = mouseXY;
        const hover =
            buttonX < mx && mx < buttonX + buttonWidth &&
            buttonY < my && my < buttonY + buttonHeight;

        debugLog('AddTextButton', 'isHover:check', {
            dataCoords: { cx, cy },
            screenCoords: { x, y },
            buttonBounds: {
                x: buttonX,
                y: buttonY,
                width: buttonWidth,
                height: buttonHeight
            },
            mouseXY: [mx, my],
            result: hover
        });

        // Always return true to make the button always clickable
        // The GenericChartComponent will handle the actual click detection
        return true;
    };

    // Handle click - only fires when actually clicking on the button
    // Using onClick instead of onClickWhenHover so clicks work without requiring hover first
    private readonly handleClick = (e: React.MouseEvent, moreProps: any) => {
        console.log('🔘 AddTextButton CLICKED!', {
            eventType: e.type,
            button: e.button,
            clientX: e.clientX,
            clientY: e.clientY
        });

        debugLog('AddTextButton', 'onClick:fired', {
            eventType: e.type,
            button: e.button,
            clientX: e.clientX,
            clientY: e.clientY
        });

        const { onClick } = this.props;

        if (!onClick) {
            console.log('❌ AddTextButton: No onClick handler provided!');
            debugWarn('AddTextButton', 'onClick fired but no onClick prop provided');
            return;
        }

        console.log('✅ AddTextButton: Calling onClick handler');
        debugLog('AddTextButton', 'onClick:accepted', {
            willCallCallback: true
        });

        e.stopPropagation(); // Prevent event bubbling
        onClick(e, moreProps);

        console.log('✅ AddTextButton: onClick handler completed');
        debugLog('AddTextButton', 'onClick:complete', {
            callbackExecuted: true
        });
    };
}
