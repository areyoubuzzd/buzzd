import React from 'react';

/**
 * Honeypot component to catch bots
 * 
 * This component renders an invisible input field that humans won't fill out
 * but bots will. If the field is filled, we can detect it's a bot.
 */
export const Honeypot = () => {
  return (
    <div 
      className="honeypot-container" 
      aria-hidden="true"
      style={{
        position: "absolute",
        left: "-9999px",
        top: "-9999px",
        zIndex: -1,
        opacity: 0,
        height: 0,
        width: 0,
        overflow: "hidden"
      }}
    >
      <label htmlFor="robot-check">
        Leave this field empty
      </label>
      <input 
        type="text" 
        id="robot-check" 
        name="robotCheck" 
        tabIndex={-1} 
        autoComplete="off"
      />
    </div>
  );
};

/**
 * Hook to add honeypot data to form submission
 */
export const useHoneypot = () => {
  return {
    getHoneypotField: () => {
      return { robotCheck: '' };
    }
  };
};

/**
 * Higher-order component to add honeypot field to a form component
 */
export function withHoneypot<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return (props: P) => {
    return (
      <>
        <Component {...props} />
        <Honeypot />
      </>
    );
  };
}