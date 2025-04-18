import { useEffect, RefObject } from 'react';

/**
 * Hook that detects clicks outside of a specified element
 * Useful for dropdown menus, modals, etc. that should close when clicking outside
 * 
 * @param ref Reference to the element to detect clicks outside of
 * @param handler Function to call when a click outside is detected
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void
): void {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      // If the click was inside the referenced element, do nothing
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      
      // Otherwise, call the handler
      handler(event);
    };
    
    // Add event listeners for both mouse and touch events
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    
    // Clean up the event listeners when the component unmounts
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]); // Re-run if the ref or handler changes
}