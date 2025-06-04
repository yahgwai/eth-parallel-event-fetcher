/**
 * Enhanced event type definitions for better type safety and developer experience
 */

import { RawEvent } from './interfaces';

/**
 * Helper type to extract event args from an event type
 */
export type EventArgs<T extends RawEvent> = T extends RawEvent<infer TArgs> ? TArgs : never;

/**
 * Helper type to create a typed event from a raw event
 */
export type TypedEvent<
  TEventName extends string,
  TArgs extends Record<string, unknown>,
> = RawEvent<TArgs> & {
  eventName: TEventName;
};

/**
 * Builder type for creating custom event types
 */
export interface EventTypeBuilder {
  /**
   * Create a typed event interface
   * @example
   * type MyEvent = EventTypeBuilder.Create<'MyEvent', { value: bigint; sender: string }>;
   */
  Create: <TName extends string, TArgs extends Record<string, unknown>>(
    name: TName,
    args: TArgs
  ) => TypedEvent<TName, TArgs>;
}

/**
 * Utility type for filtering events by name from a union
 */
export type FilterEventByName<T extends { eventName: string }, TName extends string> = T extends {
  eventName: TName;
}
  ? T
  : never;

/**
 * Type guard to check if an event has a specific property
 */
export function hasEventProperty<K extends string>(
  event: RawEvent,
  property: K
): event is RawEvent & Record<K, unknown> {
  return property in event;
}

/**
 * Type guard to check if an event has a specific event name
 */
export function isEventWithName<TName extends string>(
  event: RawEvent,
  eventName: TName
): event is RawEvent & { eventName: TName } {
  return (
    hasEventProperty(event, 'eventName') &&
    (event as RawEvent & { eventName: string }).eventName === eventName
  );
}

/**
 * Helper function to transform events with contract address context
 */
export function transformEventsWithAddress<TEvent extends RawEvent, TProcessed>(
  events: TEvent[],
  contractAddress: string,
  transform: (event: TEvent, contractAddress: string) => TProcessed
): TProcessed[] {
  return events.map((event) => transform(event, contractAddress));
}

/**
 * Event with additional metadata
 */
export type EnrichedEvent<T extends RawEvent> = T & {
  timestamp?: number;
  gasUsed?: bigint;
  gasPrice?: bigint;
  logIndex: number;
};

/**
 * Utility type for creating a discriminated union of events
 */
export type EventUnion<T extends Record<string, RawEvent>> = T[keyof T];

/**
 * Utility type for extracting event names from a union
 */
export type EventNames<T extends { eventName: string }> = T['eventName'];

/**
 * Create a mapping of event names to event types
 */
export type EventMap<T extends { eventName: string }> = {
  [K in T['eventName']]: Extract<T, { eventName: K }>;
};

/**
 * Factory for creating typed event filters
 */
export class EventFilterBuilder {
  /**
   * Create a typed event filter
   */
  static create<T extends RawEvent>(
    eventName: string,
    args?: Partial<T extends RawEvent<infer TArgs> ? TArgs : never>
  ): { eventName: string; args?: Partial<T['args']> } {
    return { eventName, args };
  }

  /**
   * Create multiple filters at once
   */
  static createMany<T extends RawEvent>(
    filters: Array<{
      eventName: string;
      args?: Partial<T extends RawEvent<infer TArgs> ? TArgs : never>;
    }>
  ) {
    return filters;
  }
}
