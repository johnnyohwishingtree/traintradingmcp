import * as React from "react";
import AutoSizer, { Size } from "react-virtualized-auto-sizer";

export interface WithSizeProps {
    readonly width: number;
    readonly height: number;
}

type AutoSizerProps = {
    disableHeight?: false;
    disableWidth?: false;
    className?: string;
    style?: React.CSSProperties;
    children: (size: Size) => React.ReactNode;
};

export const withSize = (props?: Omit<AutoSizerProps, "children">) => {
    return <TProps extends WithSizeProps>(OriginalComponent: React.ComponentClass<TProps>) => {
        return class WithSize extends React.Component<Omit<TProps, "width" | "height">> {
            public render() {
                return (
                    <AutoSizer {...props}>
                        {({ height, width }: Size) => {
                            return <OriginalComponent {...(this.props as TProps)} height={height} width={width} />;
                        }}
                    </AutoSizer>
                );
            }
        };
    };
};
