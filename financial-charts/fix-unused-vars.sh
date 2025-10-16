#!/bin/bash

# EquidistantChannel.tsx - onDragComplete at line 127 and moreProps at line 241
sed -i '' 's/onDragComplete = (e:/const _onDragComplete = (e:/' src/interactive/EquidistantChannel.tsx
sed -i '' 's/, moreProps\) =>/, _moreProps\) =>/' src/interactive/EquidistantChannel.tsx

# InfoLine.tsx - unused imports
sed -i '' "s/import { InteractiveStraightLine, isDefined, noop } from '\.\.\/core';/import { noop } from '..\/core';/" src/interactive/InfoLine.tsx

# ChannelWithArea.tsx - xScale and yScale at line 149
sed -i '' 's/\(const.*\)xScale, yScale\(.*\)=/\1_xScale, _yScale\2=/' src/interactive/components/ChannelWithArea.tsx

# TriangleWithArea.tsx - onDragStart, onDrag, onDragComplete, tolerance
sed -i '' 's/onDragStart,/_onDragStart,/g' src/interactive/components/TriangleWithArea.tsx
sed -i '' 's/onDrag,/_onDrag,/g' src/interactive/components/TriangleWithArea.tsx
sed -i '' 's/onDragComplete,/_onDragComplete,/g' src/interactive/components/TriangleWithArea.tsx
sed -i '' 's/const tolerance =/const _tolerance =/' src/interactive/components/TriangleWithArea.tsx

# EachEquidistantChannel.tsx - onDragComplete at lines 78 and 156
sed -i '' 's/const onDragComplete =/const _onDragComplete =/g' src/interactive/wrapper/EachEquidistantChannel.tsx

# EachFibRetracement.tsx - onDragComplete at line 99
sed -i '' 's/const onDragComplete =/const _onDragComplete =/' src/interactive/wrapper/EachFibRetracement.tsx

# EachHorizontalLineTrend.tsx - unused imports and variables
sed -i '' 's/import { d3Ascending } from "d3-array";/\/\/ import { d3Ascending } from "d3-array";/' src/interactive/wrapper/EachHorizontalLineTrend.tsx
sed -i '' 's/import { noop } from "\.\.\/\.\.\/core";/\/\/ import { noop } from "\.\.\/\.\.\/core";/' src/interactive/wrapper/EachHorizontalLineTrend.tsx
sed -i '' 's/import { getXValue } from "\.\.\/\.\.\/core\/utils";/\/\/ import { getXValue } from "\.\.\/\.\.\/core\/utils";/' src/interactive/wrapper/EachHorizontalLineTrend.tsx
sed -i '' 's/import { isHover } from "\.\.\/\.\.\/core\/utils\/isHover";/\/\/ import { isHover } from "\.\.\/\.\.\/core\/utils\/isHover";/' src/interactive/wrapper/EachHorizontalLineTrend.tsx
sed -i '' 's/import { generateLine, isHovering } from "\.\.\/\.\.\/core\/utils";/import { generateLine } from "\.\.\/\.\.\/core\/utils";/' src/interactive/wrapper/EachHorizontalLineTrend.tsx
sed -i '' 's/const y2Value =/const _y2Value =/' src/interactive/wrapper/EachHorizontalLineTrend.tsx
sed -i '' 's/const strokeOpacity =/const _strokeOpacity =/' src/interactive/wrapper/EachHorizontalLineTrend.tsx
sed -i '' 's/const xAccessor =/const _xAccessor =/' src/interactive/wrapper/EachHorizontalLineTrend.tsx

# EachTrendLine.tsx - unused variables
sed -i '' 's/import { generateLine, isHovering } from "\.\.\/\.\.\/core\/utils";/import { generateLine } from "\.\.\/\.\.\/core\/utils";/' src/interactive/wrapper/EachTrendLine.tsx
sed -i '' 's/const onDragComplete =/const _onDragComplete =/' src/interactive/wrapper/EachTrendLine.tsx
sed -i '' 's/, type }/,_type }/' src/interactive/wrapper/EachTrendLine.tsx

# EachTrianglePattern.tsx - onDragComplete
sed -i '' 's/const onDragComplete =/const _onDragComplete =/' src/interactive/wrapper/EachTrianglePattern.tsx

# EachVerticalLineTrend.tsx - same as horizontal
sed -i '' 's/import { d3Ascending } from "d3-array";/\/\/ import { d3Ascending } from "d3-array";/' src/interactive/wrapper/EachVerticalLineTrend.tsx
sed -i '' 's/import { noop } from "\.\.\/\.\.\/core";/\/\/ import { noop } from "\.\.\/\.\.\/core";/' src/interactive/wrapper/EachVerticalLineTrend.tsx
sed -i '' 's/import { getXValue } from "\.\.\/\.\.\/core\/utils";/\/\/ import { getXValue } from "\.\.\/\.\.\/core\/utils";/' src/interactive/wrapper/EachVerticalLineTrend.tsx
sed -i '' 's/import { isHover } from "\.\.\/\.\.\/core\/utils\/isHover";/\/\/ import { isHover } from "\.\.\/\.\.\/core\/utils\/isHover";/' src/interactive/wrapper/EachVerticalLineTrend.tsx
sed -i '' 's/import { generateLine, isHovering } from "\.\.\/\.\.\/core\/utils";/import { generateLine } from "\.\.\/\.\.\/core\/utils";/' src/interactive/wrapper/EachVerticalLineTrend.tsx
sed -i '' 's/const x2Value =/const _x2Value =/' src/interactive/wrapper/EachVerticalLineTrend.tsx
sed -i '' 's/const strokeOpacity =/const _strokeOpacity =/' src/interactive/wrapper/EachVerticalLineTrend.tsx

echo "All unused variables fixed!"
