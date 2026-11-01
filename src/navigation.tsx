import React, { createContext, useContext } from 'react';
import type { MeetingTarget } from './join';

export type Route =
  | { name: 'home' }
  | { name: 'meeting'; target: MeetingTarget }
  | { name: 'rooms' }
  | { name: 'create' }
  | { name: 'import' }
  | { name: 'room'; room: string }
  | { name: 'extend'; room: string }
  | { name: 'settings' };

export interface Navigation {
  route: Route;
  push(route: Route): void;
  pop(): void;
  /** Replaces the stack with home plus the given routes. */
  reset(...routes: Route[]): void;
}

export const NavigationContext = createContext<Navigation | null>(null);

export function useNavigation(): Navigation {
  const nav = useContext(NavigationContext);
  if (!nav) {
    throw new Error('useNavigation outside NavigationContext');
  }
  return nav;
}

export function NavigationProvider({
  value,
  children,
}: {
  value: Navigation;
  children: React.ReactNode;
}) {
  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}
