import React from 'react';

export default function AvailabilityBadge({ group }) {
  if (!group) return null;

  const isAvailable = group === 'FULLY_AVAILABLE';

  return (
    <span className={`availability-badge ${isAvailable ? 'available' : 'partial'}`}>
      {isAvailable ? '✓ Fully Available' : '◐ Partially Available'}
    </span>
  );
}
