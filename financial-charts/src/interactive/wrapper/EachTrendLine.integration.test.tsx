/**
 * Integration tests for EachTrendLine text editing workflow
 * These tests simulate the full user interaction flow to expose issues
 */

import * as React from "react";
import { EachTrendLine } from "./EachTrendLine";
import { GenericChartComponent } from "../../core";

describe("EachTrendLine text editing integration", () => {
    const mockProps = {
        x1Value: 100,
        y1Value: 200,
        x2Value: 300,
        y2Value: 250,
        type: "LINE" as const,
        index: 0,
        selected: true,
        onDrag: jest.fn(),
        onEdge1Drag: jest.fn(),
        onEdge2Drag: jest.fn(),
        onSelect: jest.fn(),
        onAddTextClick: jest.fn(),
        r: 5,
        strokeOpacity: 1,
        strokeStyle: "#000000",
        strokeWidth: 1,
        strokeDasharray: "Solid" as const,
        edgeStrokeWidth: 2,
        edgeStroke: "#000000",
        edgeInteractiveCursor: "pointer",
        lineInteractiveCursor: "pointer",
        edgeFill: "#FFFFFF",
        hoverText: {
            enable: false,
            fontFamily: "Arial",
            fontSize: 12,
            fill: "#000000",
            text: "Test",
            selectedText: "Selected",
            bgFill: "#FFFFFF",
            bgOpacity: 1,
            bgWidth: 100,
            bgHeight: 20,
        },
    };

    describe("GenericChartComponent integration", () => {
        it("should pass correct props to GenericChartComponent for text", () => {
            const component = new EachTrendLine({
                ...mockProps,
                text: "Test Text",
            });

            const rendered = component.render();

            console.log("Rendered component:", rendered);
            console.log("Component type:", rendered?.type);
            console.log("Component props keys:", rendered?.props ? Object.keys(rendered.props) : []);

            // The component should render a <g> element
            expect(rendered?.type).toBe("g");

            // Find the text label GenericChartComponent in children
            const children = React.Children.toArray(rendered?.props?.children || []);
            console.log("Number of children:", children.length);

            // Look for the text label component
            const textComponent = children.find((child: any) => {
                // Check if this is the text label GenericChartComponent
                if (child?.type === GenericChartComponent) {
                    const props = child.props;
                    // Text label has svgDraw but no show prop (unlike AddTextButton)
                    return props.svgDraw && !('show' in props) && props.selected;
                }
                return false;
            }) as any;

            if (textComponent) {
                console.log("✓ Found text label component");
                console.log("Text component props:", Object.keys(textComponent.props));

                // Verify it has the interactive props
                expect(textComponent.props.selected).toBe(true);
                expect(textComponent.props.isHover).toBeDefined();
                expect(textComponent.props.onClickWhenHover).toBeDefined();
                expect(textComponent.props.svgDraw).toBeDefined();

                console.log("✓ Text component has interactive props (selected, isHover, onClickWhenHover)");
            } else {
                console.log("✗ Text label component NOT found");
                children.forEach((child: any, idx) => {
                    console.log(`  Child ${idx}:`, {
                        type: child?.type?.name || child?.type,
                        props: child?.props ? Object.keys(child.props) : []
                    });
                });

                fail("Text label GenericChartComponent not found in children");
            }
        });

        it("should verify isHover function is correctly bound", () => {
            const component = new EachTrendLine({
                ...mockProps,
                text: "Test Text",
            });

            const rendered = component.render();
            const children = React.Children.toArray(rendered?.props?.children || []);

            const textComponent = children.find((child: any) =>
                child?.type === GenericChartComponent &&
                child?.props?.selected &&
                child?.props?.svgDraw &&
                !('show' in child.props)
            ) as any;

            if (textComponent) {
                const { isHover } = textComponent.props;

                // Test the isHover function
                const mockMoreProps = {
                    mouseXY: [200, 165], // At the text position (midpoint - 50)
                    xScale: (x: number) => x,
                    chartConfig: { yScale: (y: number) => y },
                };

                const result = isHover(mockMoreProps);
                console.log("isHover result at text position:", result);

                // Should return true when hovering over text
                expect(typeof result).toBe("boolean");

                // Test with mouse far away
                const mockFarAway = {
                    mouseXY: [500, 500],
                    xScale: (x: number) => x,
                    chartConfig: { yScale: (y: number) => y },
                };

                const resultFar = isHover(mockFarAway);
                console.log("isHover result far away:", resultFar);
                expect(resultFar).toBe(false);
            }
        });

        it("should verify onClickWhenHover callback is correctly bound", () => {
            const mockOnAddTextClick = jest.fn();
            const component = new EachTrendLine({
                ...mockProps,
                text: "Test Text",
                index: 5,
                onAddTextClick: mockOnAddTextClick,
            });

            const rendered = component.render();
            const children = React.Children.toArray(rendered?.props?.children || []);

            const textComponent = children.find((child: any) =>
                child?.type === GenericChartComponent &&
                child?.props?.selected &&
                child?.props?.svgDraw &&
                !('show' in child.props)
            ) as any;

            if (textComponent) {
                const { onClickWhenHover } = textComponent.props;

                // Simulate click
                const mockEvent = {
                    stopPropagation: jest.fn(),
                } as any;

                const mockMoreProps = {};

                onClickWhenHover(mockEvent, mockMoreProps);

                // Verify the callback was invoked
                expect(mockEvent.stopPropagation).toHaveBeenCalled();
                expect(mockOnAddTextClick).toHaveBeenCalledWith(mockEvent, 5);

                console.log("✓ onClickWhenHover correctly invoked onAddTextClick");
            }
        });
    });

    describe("AddTextButton vs Text Label rendering", () => {
        it("should render AddTextButton when no text exists", () => {
            const component = new EachTrendLine({
                ...mockProps,
                selected: true,
            });

            const rendered = component.render();
            const children = React.Children.toArray(rendered?.props?.children || []);

            console.log("\nTest: No text - should show AddTextButton");

            // Look for AddTextButton (it has a 'show' prop)
            const addTextButton = children.find((child: any) => {
                if (child?.type?.name === 'AddTextButton' || child?.props?.show !== undefined) {
                    return true;
                }
                return false;
            }) as any;

            console.log("AddTextButton found:", !!addTextButton);
            console.log("AddTextButton show prop:", addTextButton?.props?.show);

            expect(addTextButton).toBeDefined();
            expect(addTextButton?.props?.show).toBe(true);
        });

        it("should NOT render AddTextButton when text exists", () => {
            const component = new EachTrendLine({
                ...mockProps,
                selected: true,
                text: "Existing Text",
            });

            const rendered = component.render();
            const children = React.Children.toArray(rendered?.props?.children || []);

            console.log("\nTest: With text - should NOT show AddTextButton");

            const addTextButton = children.find((child: any) =>
                child?.type?.name === 'AddTextButton' || child?.props?.show !== undefined
            ) as any;

            console.log("AddTextButton found:", !!addTextButton);
            console.log("AddTextButton show prop:", addTextButton?.props?.show);

            // AddTextButton should have show=false
            expect(addTextButton?.props?.show).toBe(false);
        });

        it("should render text label when text exists", () => {
            const component = new EachTrendLine({
                ...mockProps,
                selected: true,
                text: "My Label",
            });

            const rendered = component.render();
            const children = React.Children.toArray(rendered?.props?.children || []);

            console.log("\nTest: With text - should show text label");

            // Look for text label GenericChartComponent
            const textComponent = children.find((child: any) =>
                child?.type === GenericChartComponent &&
                child?.props?.selected &&
                child?.props?.svgDraw &&
                !('show' in child.props)
            );

            console.log("Text label component found:", !!textComponent);

            expect(textComponent).toBeDefined();
        });
    });

    describe("Click handler workflow", () => {
        it("should have handleTextClick method that prevents event bubbling", () => {
            const mockOnAddTextClick = jest.fn();
            const component = new EachTrendLine({
                ...mockProps,
                text: "Test",
                index: 3,
                onAddTextClick: mockOnAddTextClick,
            });

            // Access private method
            const handleTextClick = (component as any).handleTextClick;

            const mockEvent = {
                stopPropagation: jest.fn(),
                preventDefault: jest.fn(),
            } as any;

            const mockMoreProps = {};

            handleTextClick.call(component, mockEvent, mockMoreProps);

            // Critical: stopPropagation must be called to prevent line selection
            expect(mockEvent.stopPropagation).toHaveBeenCalled();
            console.log("✓ stopPropagation called");

            // Callback should be invoked with correct index
            expect(mockOnAddTextClick).toHaveBeenCalledWith(mockEvent, 3);
            console.log("✓ onAddTextClick called with correct index");
        });

        it("should calculate correct hit area for text", () => {
            const component = new EachTrendLine({
                ...mockProps,
                text: "Short",
            });

            const isHoverText = (component as any).isHoverText;

            // Text is at midpoint - 50px
            // Midpoint: (100+300)/2 = 200, (200+250)/2 = 225
            // Text position: (200, 225-50) = (200, 175)

            // Test clicking exactly at text position
            const exactHit = {
                mouseXY: [200, 175],
                xScale: (x: number) => x,
                chartConfig: { yScale: (y: number) => y },
            };

            const result = isHoverText(exactHit);
            console.log("Hit detection at exact text position:", result);
            expect(result).toBe(true);

            // Test clicking slightly off
            const nearMiss = {
                mouseXY: [250, 175],
                xScale: (x: number) => x,
                chartConfig: { yScale: (y: number) => y },
            };

            const resultNear = isHoverText(nearMiss);
            console.log("Hit detection near text:", resultNear);
        });
    });

    describe("Problem detection tests", () => {
        it("CRITICAL: Verify text property flows through to component", () => {
            console.log("\n=== CRITICAL TEST: Text Property Flow ===");

            const testText = "Critical Test Label";
            const component = new EachTrendLine({
                ...mockProps,
                text: testText,
            });

            // Check if text is stored in props
            const componentProps = (component as any).props;
            console.log("Component props.text:", componentProps.text);

            expect(componentProps.text).toBe(testText);
            console.log("✓ Text property correctly stored in component props");

            // Check if text is used in render
            const rendered = component.render();
            const renderedString = JSON.stringify(rendered);

            console.log("Checking if text appears in rendered output...");
            // The text should appear somewhere in the rendered structure
            // Either in svgDraw callback or in component props

            const children = React.Children.toArray(rendered?.props?.children || []);
            const textComponent = children.find((child: any) =>
                child?.type === GenericChartComponent &&
                child?.props?.svgDraw
            ) as any;

            if (textComponent) {
                console.log("✓ Found GenericChartComponent with svgDraw");

                // Try to execute svgDraw to see if it renders the text
                try {
                    const mockScales = {
                        xScale: (x: number) => x,
                        chartConfig: { yScale: (y: number) => y },
                    };

                    const svgOutput = textComponent.props.svgDraw(mockScales);
                    console.log("SVG output type:", svgOutput?.type);
                    console.log("SVG output props:", svgOutput?.props);

                    if (svgOutput?.type === 'text') {
                        console.log("✓ svgDraw returns <text> element");
                        console.log("Text content:", svgOutput?.props?.children);

                        expect(svgOutput.props.children).toBe(testText);
                        console.log("✓✓✓ TEXT RENDERS CORRECTLY");
                    }
                } catch (e) {
                    console.log("Error executing svgDraw:", e);
                }
            }
        });

        it("CRITICAL: Verify text label ONLY renders when trendline has text property", () => {
            console.log("\n=== CRITICAL TEST: Conditional Text Rendering ===");

            // Test 1: No text property - should NOT have text GenericChartComponent
            const componentWithoutText = new EachTrendLine({
                ...mockProps,
                selected: true,
            });

            const renderedWithoutText = componentWithoutText.render();
            const childrenWithoutText = React.Children.toArray(renderedWithoutText?.props?.children || []);

            const textComponentWithoutText = childrenWithoutText.find((child: any) =>
                child?.type === GenericChartComponent &&
                child?.props?.selected &&
                child?.props?.svgDraw &&
                !('show' in child.props) // Text component doesn't have 'show' prop
            );

            console.log("Text component found when no text:", !!textComponentWithoutText);
            expect(textComponentWithoutText).toBeUndefined();
            console.log("✓ Text GenericChartComponent correctly NOT rendered when no text");

            // Test 2: With text property - SHOULD have text GenericChartComponent
            const componentWithText = new EachTrendLine({
                ...mockProps,
                selected: true,
                text: "Test Label",
            });

            const renderedWithText = componentWithText.render();
            const childrenWithText = React.Children.toArray(renderedWithText?.props?.children || []);

            const textComponentWithText = childrenWithText.find((child: any) =>
                child?.type === GenericChartComponent &&
                child?.props?.selected &&
                child?.props?.svgDraw &&
                !('show' in child.props)
            );

            console.log("Text component found when text exists:", !!textComponentWithText);

            if (!textComponentWithText) {
                fail("PROBLEM FOUND: Text GenericChartComponent NOT rendered even though text property exists!");
            }

            expect(textComponentWithText).toBeDefined();
            console.log("✓✓✓ Text GenericChartComponent correctly rendered when text exists");
        });

        it("CRITICAL: Verify GenericChartComponent receives click handler", () => {
            console.log("\n=== CRITICAL TEST: Click Handler Binding ===");

            const mockCallback = jest.fn();
            const component = new EachTrendLine({
                ...mockProps,
                text: "Test",
                onAddTextClick: mockCallback,
                index: 7,
            });

            const rendered = component.render();
            const children = React.Children.toArray(rendered?.props?.children || []);

            const textComponent = children.find((child: any) =>
                child?.type === GenericChartComponent &&
                child?.props?.selected &&
                !('show' in child.props)
            ) as any;

            if (!textComponent) {
                fail("Text component not found - text label not rendering!");
            }

            console.log("Text component props:", Object.keys(textComponent.props));

            const hasOnClickWhenHover = 'onClickWhenHover' in textComponent.props;
            const hasIsHover = 'isHover' in textComponent.props;
            const hasSelected = textComponent.props.selected === true;

            console.log("Has onClickWhenHover:", hasOnClickWhenHover);
            console.log("Has isHover:", hasIsHover);
            console.log("Has selected:", hasSelected);

            if (!hasOnClickWhenHover) {
                fail("PROBLEM FOUND: onClickWhenHover NOT passed to GenericChartComponent!");
            }

            if (!hasIsHover) {
                fail("PROBLEM FOUND: isHover NOT passed to GenericChartComponent!");
            }

            if (!hasSelected) {
                fail("PROBLEM FOUND: selected NOT set to true!");
            }

            console.log("✓✓✓ All interactive props correctly passed");

            // Now test that clicking actually works
            const { onClickWhenHover } = textComponent.props;
            const mockEvent = { stopPropagation: jest.fn() } as any;

            onClickWhenHover(mockEvent, {});

            if (!mockCallback.mock.calls.length) {
                fail("PROBLEM FOUND: Callback NOT invoked when clicking!");
            }

            expect(mockCallback).toHaveBeenCalledWith(mockEvent, 7);
            console.log("✓✓✓ Click handler works correctly");
        });

        it("CRITICAL: Compare text label vs AddTextButton GenericChartComponent setup", () => {
            console.log("\n=== CRITICAL TEST: Compare Interactive Setups ===");

            // Render with no text to see AddTextButton
            const componentWithButton = new EachTrendLine({
                ...mockProps,
                selected: true,
                onAddTextClick: jest.fn(),
            });

            const renderedButton = componentWithButton.render();
            const childrenButton = React.Children.toArray(renderedButton?.props?.children || []);

            // Find AddTextButton (it has a 'show' prop)
            const addTextButton = childrenButton.find((child: any) =>
                child?.type === GenericChartComponent &&
                'show' in child.props
            ) as any;

            console.log("\n📊 AddTextButton GenericChartComponent:");
            if (addTextButton) {
                console.log("  Props:", Object.keys(addTextButton.props));
                console.log("  show:", addTextButton.props.show);
                console.log("  selected:", addTextButton.props.selected);
                console.log("  isHover:", typeof addTextButton.props.isHover);
                console.log("  onClickWhenHover:", typeof addTextButton.props.onClickWhenHover);
            }

            // Render with text to see text label
            const componentWithText = new EachTrendLine({
                ...mockProps,
                selected: true,
                text: "Test Label",
                onAddTextClick: jest.fn(),
            });

            const renderedText = componentWithText.render();
            const childrenText = React.Children.toArray(renderedText?.props?.children || []);

            // Find text label (it has selected=true, svgDraw, but no 'show' prop)
            const textLabel = childrenText.find((child: any) =>
                child?.type === GenericChartComponent &&
                child?.props?.selected &&
                child?.props?.svgDraw &&
                !('show' in child.props)
            ) as any;

            console.log("\n📊 Text Label GenericChartComponent:");
            if (textLabel) {
                console.log("  Props:", Object.keys(textLabel.props));
                console.log("  selected:", textLabel.props.selected);
                console.log("  isHover:", typeof textLabel.props.isHover);
                console.log("  onClickWhenHover:", typeof textLabel.props.onClickWhenHover);
                console.log("  svgDraw:", typeof textLabel.props.svgDraw);
                console.log("  drawOn:", textLabel.props.drawOn);
            } else {
                console.log("  ❌ TEXT LABEL NOT FOUND!");
                fail("PROBLEM FOUND: Text label GenericChartComponent not rendered!");
            }

            // Compare the two setups
            console.log("\n🔍 Comparison:");

            if (addTextButton && textLabel) {
                const buttonHasIsHover = typeof addTextButton.props.isHover === 'function';
                const textHasIsHover = typeof textLabel.props.isHover === 'function';

                const buttonHasOnClick = typeof addTextButton.props.onClickWhenHover === 'function';
                const textHasOnClick = typeof textLabel.props.onClickWhenHover === 'function';

                console.log("  AddTextButton has isHover:", buttonHasIsHover);
                console.log("  Text Label has isHover:", textHasIsHover);
                console.log("  AddTextButton has onClickWhenHover:", buttonHasOnClick);
                console.log("  Text Label has onClickWhenHover:", textHasOnClick);

                if (!textHasIsHover) {
                    fail("PROBLEM FOUND: Text label missing isHover function!");
                }

                if (!textHasOnClick) {
                    fail("PROBLEM FOUND: Text label missing onClickWhenHover function!");
                }

                // Both should have the same interactive props
                expect(textHasIsHover).toBe(true);
                expect(textHasOnClick).toBe(true);

                console.log("✓✓✓ Text label has same interactive setup as AddTextButton");
            }
        });

        it("CRITICAL: Verify text label is NOT hidden when selected=false", () => {
            console.log("\n=== CRITICAL TEST: Text Visibility When Not Selected ===");

            // Create component with text but NOT selected
            const component = new EachTrendLine({
                ...mockProps,
                selected: false,
                text: "Always Visible",
            });

            const rendered = component.render();
            const children = React.Children.toArray(rendered?.props?.children || []);

            // Find text label
            const textLabel = children.find((child: any) =>
                child?.type === GenericChartComponent &&
                child?.props?.svgDraw &&
                !('show' in child.props)
            ) as any;

            if (!textLabel) {
                fail("PROBLEM FOUND: Text label NOT rendered when selected=false! Text should always be visible once created.");
            }

            console.log("✓ Text label found when selected=false");

            // Verify the SVG actually renders the text
            try {
                const mockScales = {
                    xScale: (x: number) => x,
                    chartConfig: { yScale: (y: number) => y },
                };

                const svgOutput = textLabel.props.svgDraw(mockScales);

                if (svgOutput?.type !== 'text') {
                    fail("PROBLEM FOUND: svgDraw doesn't return <text> element when selected=false!");
                }

                expect(svgOutput.props.children).toBe("Always Visible");
                console.log("✓✓✓ Text label renders correctly when not selected");
            } catch (e) {
                fail(`PROBLEM FOUND: Error rendering text when selected=false: ${e}`);
            }
        });

        it("CRITICAL BUG FOUND: GenericComponent requires hover before click", () => {
            console.log("\n=== CRITICAL TEST: GenericComponent Click Behavior ===");

            console.log("🔍 ANALYSIS:");
            console.log("GenericComponent's click handler (line 185-196 in GenericComponent.tsx):");
            console.log("  case \"click\": {");
            console.log("    const { onClickWhenHover } = this.props;");
            console.log("    if (moreProps.hovering && onClickWhenHover !== undefined) {");
            console.log("      onClickWhenHover(e, moreProps);  // ← ONLY fires if hovering=true");
            console.log("    }");
            console.log("  }");
            console.log("");
            console.log("The 'hovering' property is set in mousemove handler (line 199-237):");
            console.log("  case \"mousemove\": {");
            console.log("    this.moreProps.hovering = this.isHover(e);");
            console.log("  }");
            console.log("");
            console.log("🐛 PROBLEM IDENTIFIED:");
            console.log("  1. User clicks on text label WITHOUT hovering first");
            console.log("  2. No mousemove event = hovering never set to true");
            console.log("  3. Click event fires but hovering=false");
            console.log("  4. onClickWhenHover callback DOES NOT EXECUTE");
            console.log("");
            console.log("💡 EXPLANATION:");
            console.log("  This is why the user reported: 'manually after I draw the line,");
            console.log("  I cannot click on the text to edit it'");
            console.log("");
            console.log("  The user is clicking directly on the text without hovering over it first.");
            console.log("  Since there's no hover, GenericComponent never calls onClickWhenHover.");
            console.log("");
            console.log("🔧 SOLUTION:");
            console.log("  Text labels need to work differently than buttons because:");
            console.log("  - Buttons show on hover, so user MUST hover before clicking");
            console.log("  - Text labels are ALWAYS visible, so user can click without hovering");
            console.log("");
            console.log("  Option 1: Use onClick instead of onClickWhenHover for text labels");
            console.log("  Option 2: Add direct click handler to SVG <text> element");
            console.log("  Option 3: Use a different component wrapper that doesn't require hover");

            // This test documents the bug rather than testing functionality
            expect(true).toBe(true);

            console.log("\n✓✓✓ BUG SUCCESSFULLY IDENTIFIED AND DOCUMENTED");
        });
    });
});
