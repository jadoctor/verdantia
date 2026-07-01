import React from 'react';
import PremiumVisibilityToggle from '@/components/ui/PremiumVisibilityToggle';

interface EspecieVisibilityToggleProps {
  visibilidad: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function EspecieVisibilityToggle({ visibilidad, onChange }: EspecieVisibilityToggleProps) {
  return (
    <PremiumVisibilityToggle 
      name="especiesvegetalesvisibilidadsino"
      label="Especie con Visibilidad Global (Pública)"
      checked={!!visibilidad}
      onChange={onChange}
    />
  );
}
