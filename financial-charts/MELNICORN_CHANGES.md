# Melnicorn Financial Charts - Fork Changes Documentation

## Overview
This document captures the essence of what melnicorn-financial-charts was trying to achieve as a fork of react-financial-charts.

## Key Changes from Upstream

### 1. Real-time X-axis Rescaling During Panning (Commit: 626aba9)
**Author:** Chris Melnick  
**Date:** July 1, 2025  
**Intent:** Adjust x-axis while panning for real-time updates

**Changes Made:**
- Modified `shouldComponentUpdate()` from `return !this.panInProgress` to `return true`
- Removed `ignoreThresholds: true` from filterData during panning
- Added real-time state updates during pan operations with `setState()` calls

**Issue Discovered:** This caused wheel scroll blanking because it allowed component updates during zoom operations, combined with `clearThreeCanvas()` calls that cleared the canvas during zoom.

### 2. Triangle Drawing Tool (Commit: 162d264)
**Author:** Johnny Huang  
**Date:** After fork
**Intent:** Add triangle pattern drawing capability for technical analysis

**Key Features:**
- Added `TriangleTool` component for drawing triangle patterns
- Triangle patterns are useful for identifying consolidation zones in trading
- Integrated with existing drawing toolbar

### 3. Line Drawing Without Drag Requirements (Commit: 83bd85f)
**Author:** Johnny Huang  
**Date:** After fork
**Intent:** Fix the requirement of needing to use drags to draw lines

**Key Features:**
- Simplified line drawing interaction - no longer requires drag gestures
- More intuitive drawing experience for users
- Better UX for quick line annotations

### 4. Tooltip Display Format Improvements (Commit: 7237f10)
**Author:** Unknown
**Intent:** Adding displayformat per tooltip in tooltip group

**Key Features:**
- Allow custom display formats for individual tooltips
- More flexible tooltip configuration
- Better data presentation options

### 5. Bug Fixes and Cleanup (Commits: bea39e2, 529f059, 4932e0e)
- Removed bugs
- Fixed URLs
- Removed unused stuff

### 6. Storybook Migration (Commits: 8d6561c, 2fee1a9)
- Fixed Storybook configuration
- Started moving to single repo structure

## Performance Issues Identified

### Wheel Scroll Blanking Issue
**Root Cause:** The combination of:
1. `shouldComponentUpdate()` returning `true` (allowing updates during pan/zoom)
2. `clearThreeCanvas()` being called in `handleZoom()` method
3. This caused visible blank frames during wheel scroll operations

**Solution:** Comment out `clearThreeCanvas()` in `handleZoom()` to prevent canvas clearing during zoom operations.

## Saved Commits
The following commits contain valuable features that should be preserved:
- `162d264`: Triangle drawing tool implementation
- `83bd85f`: Line drawing UX improvements

These have been saved as patch files in the `saved-patches/` directory.

## Reversion Point
The codebase will be reverted to commit `3ba45cc` (version bump) which represents the last stable point before the problematic changes, while keeping it aligned with the upstream react-financial-charts fork point.