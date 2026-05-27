import React, { useEffect, useRef, useState } from 'react';

export default function PriceTicker({ value, changePercent, className = '' }) {
  const prevValueRef = useRef(value);
  const [flashClass, setFlashClass] = useState('');

  useEffect(() => {
    if (value > prevValueRef.current) {
      setFlashClass('flash-up text-accentGreen');
    } else if (value < prevValueRef.current) {
      setFlashClass('flash-down text-accentRed');
    }
    prevValueRef.current = value;

    const timer = setTimeout(() => {
      setFlashClass('');
    }, 1000);
    return () => clearTimeout(timer);
  }, [value]);

  const formatRupees = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  const isPositive = changePercent !== undefined ? changePercent >= 0 : value >= 0;
  const colorClass = isPositive ? 'text-accentGreen' : 'text-accentRed';

  return (
    <span className={`transition-all duration-300 ${flashClass || colorClass} ${className}`}>
      {formatRupees(value)}
    </span>
  );
}
