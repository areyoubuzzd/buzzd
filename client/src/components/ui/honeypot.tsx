/**
 * Honeypot Component
 * 
 * This component renders a hidden form field that only bots will fill out.
 * Used to detect and block automated scraping attempts.
 * 
 * The field looks like a normal input to bots but is hidden from human users.
 */

import React from 'react';

interface HoneypotProps {
  inputName?: string;
  labelText?: string;
}

export function Honeypot({ 
  inputName = 'robotCheck',
  labelText = 'Leave this field empty'
}: HoneypotProps) {
  return (
    <div 
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
        height: '1px',
        width: '1px',
        overflow: 'hidden',
        opacity: 0,
        pointerEvents: 'none'
      }}
    >
      <label htmlFor={inputName}>{labelText}</label>
      <input
        type="text"
        id={inputName}
        name={inputName}
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
}

/**
 * Use this component in your forms to detect bots.
 * Example usage:
 * 
 * <form>
 *   <Honeypot />
 *   ... your regular form fields
 * </form>
 * 
 * The backend will check if this field was filled in and block the submission
 * if it was. Only bots will fill this field as humans cannot see it.
 */