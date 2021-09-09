/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { YGMeasureMode } from './enums';
import { YGConfig } from './ygconfig';
import { YGNode } from './ygnode';

export enum LayoutType {
    kLayout = 0,
    kMeasure = 1,
    kCachedLayout = 2,
    kCachedMeasure = 3,
}

export enum LayoutPassReason {
    kInitial = 0,
    kAbsLayout = 1,
    kStretch = 2,
    kMultilineStretch = 3,
    kFlexLayout = 4,
    kMeasureChild = 5,
    kAbsMeasureChild = 6,
    kFlexMeasure = 7,
}

type LayoutPassCounts = [number, number, number, number, number, number, number, number];

export class LayoutData {
    layouts: number;
    measures: number;
    maxMeasureCache: number;
    cachedLayouts: number;
    cachedMeasures: number;
    measureCallbacks: number;
    measureCallbackReasonsCount: LayoutPassCounts;

    constructor(
        layouts = 0,
        measures = 0,
        maxMeasureCache = 0,
        cachedLayouts = 0,
        cachedMeasures = 0,
        measureCallbacks = 0,
        measureCallbackReasonsCount: LayoutPassCounts = [0, 0, 0, 0, 0, 0, 0, 0],
    ) {
        this.layouts = layouts;
        this.measures = measures;
        this.maxMeasureCache = maxMeasureCache;
        this.cachedLayouts = cachedLayouts;
        this.cachedMeasures = cachedMeasures;
        this.measureCallbacks = measureCallbacks;
        this.measureCallbackReasonsCount = measureCallbackReasonsCount;
    }
}

export function LayoutPassReasonToString(value: LayoutPassReason): string {
    switch (value) {
        case LayoutPassReason.kInitial:
            return 'initial';
        case LayoutPassReason.kAbsLayout:
            return 'abs_layout';
        case LayoutPassReason.kStretch:
            return 'stretch';
        case LayoutPassReason.kMultilineStretch:
            return 'multiline_stretch';
        case LayoutPassReason.kFlexLayout:
            return 'flex_layout';
        case LayoutPassReason.kMeasureChild:
            return 'measure';
        case LayoutPassReason.kAbsMeasureChild:
            return 'abs_measure';
        case LayoutPassReason.kFlexMeasure:
            return 'flex_measure';
        default:
            return 'unknown';
    }
}

// deviation: enum name is 'EventType' instead of 'Type' as it can't be defined
// under the class in TypeScript and the naming is vague if left as-is.
export enum EventType {
    NodeAllocation,
    NodeDeallocation,
    NodeLayout,
    LayoutPassStart,
    LayoutPassEnd,
    MeasureCallbackStart,
    MeasureCallbackEnd,
    NodeBaselineStart,
    NodeBaselineEnd,
}

interface Subscriber {
    (node: YGNode, type: EventType, data: any): void;
}

type Subscribers = Subscriber[];

// deviation: class name is 'YGEvent' instead of 'Event' to prevent name clash.
export class YGEvent {
    static reset(): void {
        subscribers.splice(0, subscribers.length);
    }

    static subscribe(subscriber: Subscriber): void {
        push(subscriber);
    }

    // deviation: we expect 'eventType' in the public implementation of
    // 'publish' as we can't infer 'eventType' with just 'eventData' being
    // provided as it's an interface and not a class.
    static publish(node: YGNode, eventType: EventType, eventData?: EventData): void {
        for (const subscriber of subscribers) {
            subscriber(node, eventType, eventData);
        }
    }
}

export type EventData =
    | NodeAllocationData
    | NodeDeallocationData
    | LayoutPassStartData
    | LayoutPassEndData
    | MeasureCallbackEndData
    | NodeLayoutData;

export interface NodeAllocationData {
    config: YGConfig;
}

export interface NodeDeallocationData {
    config: YGConfig;
}

export interface LayoutPassStartData {
    layoutContext: any;
}

export interface LayoutPassEndData {
    layoutContext: any;
    layoutData: LayoutData;
}

export interface MeasureCallbackEndData {
    layoutContext: any;
    width: number;
    widthMeasureMode: YGMeasureMode;
    height: number;
    heightMeasureMode: YGMeasureMode;
    measuredWidth: number;
    measuredHeight: number;
    reason: LayoutPassReason;
}

export interface NodeLayoutData {
    layoutType: LayoutType;
    layoutContext: any;
}

// deviation: use a list of subscribers instead of a reverse linked list for
// tracking active subscribers to simplify implementation.

const subscribers: Subscribers = [];

function push(newHead: Subscriber): Subscriber {
    let oldHead: Subscriber = null;
    if (subscribers.length > 0) {
        oldHead = subscribers[subscribers.length - 1];
    }
    subscribers.push(newHead);
    return oldHead;
}
