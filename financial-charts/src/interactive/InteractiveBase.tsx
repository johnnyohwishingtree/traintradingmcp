import * as React from "react";
import { noop } from "../core";
import { HoverTextNearMouse } from "./components";
import { isHoverForInteractiveType, saveNodeType, terminate } from "./utils";

export interface InteractiveBaseProps {
    readonly enabled: boolean;
    readonly onStart?: (e: React.MouseEvent, moreProps: any) => void;
    readonly onComplete?: (e: React.MouseEvent, newItems: any[], moreProps: any) => void;
    readonly onSelect?: (e: React.MouseEvent, interactives: any[], moreProps: any) => void;
    readonly currentPositionStroke?: string;
    readonly currentPositionStrokeWidth?: number;
    readonly currentPositionstrokeOpacity?: number;
    readonly currentPositionRadius?: number;
    readonly hoverText: object;
    readonly appearance: {
        readonly strokeStyle: string;
        readonly strokeWidth: number;
        readonly edgeStrokeWidth: number;
        readonly edgeFill: string;
        readonly edgeStroke: string;
    };
}

export interface InteractiveBaseState {
    current?: any;
    override?: any;
}

export abstract class InteractiveBase<
    TProps extends InteractiveBaseProps,
    TState extends InteractiveBaseState,
> extends React.Component<TProps, TState> {
    public static defaultProps = {
        onStart: noop,
        onSelect: noop,
        currentPositionStroke: "#000000",
        currentPositionstrokeOpacity: 1,
        currentPositionStrokeWidth: 3,
        currentPositionRadius: 0,
        hoverText: {
            ...HoverTextNearMouse.defaultProps,
            enable: true,
            bgHeight: "auto",
            bgWidth: "auto",
            text: "Click to select object",
            selectedText: "",
        },
        appearance: {
            strokeStyle: "#000000",
            strokeWidth: 1,
            edgeStrokeWidth: 1,
            edgeFill: "#FFFFFF",
            edgeStroke: "#000000",
        },
    };

    // Common properties all interactive components need
    protected getSelectionState: any;
    protected mouseMoved: any;
    protected saveNodeType: any;
    protected terminate: any;

    public constructor(props: TProps) {
        super(props);

        this.terminate = terminate.bind(this);
        this.saveNodeType = saveNodeType.bind(this);
        this.getSelectionState = isHoverForInteractiveType(this.getInteractiveType()).bind(this);

        this.state = {} as TState;
    }

    // Abstract methods that child classes must implement
    protected abstract getInteractiveType(): string;
    public abstract render(): React.ReactNode;

    // Common drag handling that can be overridden
    protected readonly handleDragComplete = (e: React.MouseEvent, moreProps: any) => {
        const { override } = this.state;

        if (override) {
            const newItems = this.updateItemsAfterDrag(override);

            this.setState({ override: null } as Pick<TState, keyof TState>, () => {
                const { onComplete } = this.props;
                if (onComplete !== undefined) {
                    onComplete(e, newItems, moreProps);
                }
            });
        }
    };

    protected readonly handleDrag = (_: React.MouseEvent, index: number | undefined, newValue: any) => {
        this.setState({
            override: {
                index,
                ...newValue,
            },
        } as Pick<TState, keyof TState>);
    };

    // Abstract method for updating items after drag - child classes implement specific logic
    protected abstract updateItemsAfterDrag(override: any): any[];
}
