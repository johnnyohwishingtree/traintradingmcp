import * as React from "react";
import { GenericChartComponent } from "../../core";

export interface InlineTextEditorProps {
    /** Whether to show the editor */
    readonly show: boolean;
    /** X position in data coordinates */
    readonly cx: number;
    /** Y position in data coordinates */
    readonly cy: number;
    /** Current text value */
    readonly value: string;
    /** Callback when text is saved */
    readonly onSave?: (text: string) => void;
    /** Callback when editing is cancelled */
    readonly onCancel?: () => void;
}

/**
 * SVG-based inline text editor that appears at the exact same location as the text label
 * Uses foreignObject to embed HTML input inside SVG, so it moves with the chart
 */
export class InlineTextEditor extends React.Component<InlineTextEditorProps> {
    private inputRef = React.createRef<HTMLInputElement>();

    public static defaultProps = {
        show: false,
        value: '',
    };

    public componentDidUpdate(prevProps: InlineTextEditorProps) {
        // Auto-focus and select text when editor becomes visible
        if (!prevProps.show && this.props.show && this.inputRef.current) {
            // Use setTimeout to ensure the input is rendered
            setTimeout(() => {
                if (this.inputRef.current) {
                    this.inputRef.current.focus();
                    this.inputRef.current.select();
                }
            }, 0);
        }
    }

    public render() {
        const { show, cx, cy, value } = this.props;

        if (!show) {
            return null;
        }

        return (
            <GenericChartComponent
                selected
                svgDraw={({ xScale, chartConfig: { yScale } }: any) => {
                    const x = xScale(cx);
                    const y = yScale(cy);

                    // Use EXACT same positioning as AddTextButton and text label
                    const offsetY = -40;
                    const buttonY = y + offsetY;
                    const textY = buttonY + 16;

                    // Center the editor at the text position
                    const editorWidth = 200;
                    const editorHeight = 32;
                    const editorX = x - editorWidth / 2;
                    const editorY = textY - editorHeight / 2;

                    return (
                        <foreignObject
                            x={editorX}
                            y={editorY}
                            width={editorWidth}
                            height={editorHeight}
                        >
                            <input
                                ref={this.inputRef}
                                type="text"
                                defaultValue={value}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    padding: '4px 8px',
                                    border: '1px solid #26a69a',
                                    borderRadius: '3px',
                                    fontSize: '14px',
                                    fontFamily: '-apple-system, system-ui, Roboto, "Helvetica Neue", Ubuntu, sans-serif',
                                    fontWeight: '600',
                                    color: '#26a69a',
                                    background: 'rgba(255, 255, 255, 0.95)',
                                    outline: 'none',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                    textAlign: 'center',
                                    boxSizing: 'border-box'
                                }}
                                onKeyDown={this.handleKeyDown}
                                onBlur={this.handleBlur}
                            />
                        </foreignObject>
                    );
                }}
                drawOn={["pan"]}
            />
        );
    }

    private readonly handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const { onSave, onCancel } = this.props;

        if (e.key === 'Enter') {
            e.preventDefault();
            if (onSave && this.inputRef.current) {
                onSave(this.inputRef.current.value);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            if (onCancel) {
                onCancel();
            }
        }
    };

    private readonly handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { onSave, onCancel } = this.props;

        // Save on blur if there's text
        if (e.currentTarget.value.trim()) {
            if (onSave) {
                onSave(e.currentTarget.value);
            }
        } else {
            if (onCancel) {
                onCancel();
            }
        }
    };
}
