import React from 'react';
import { formatDuration } from '../format';
import { Choices } from './Choices';

export function DurationPicker({
  durations,
  value,
  onChange,
  disabled,
}: {
  durations: number[];
  value: number;
  onChange: (h: number) => void;
  disabled?: boolean;
}) {
  return (
    <Choices
      options={durations.map(h => ({ value: h, label: formatDuration(h) }))}
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  );
}
