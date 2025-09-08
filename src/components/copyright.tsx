'use client';

import { useState, useEffect } from 'react';

export default function Copyright() {
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    // Este efeito garante que o componente seja renderizado no cliente e evita a incompatibilidade de hidratação,
    // embora seja improvável que o valor mude entre a renderização do servidor e do cliente.
    // É uma boa prática para valores dinâmicos e dependentes do cliente.
    setYear(new Date().getFullYear());
  }, []);

  return <p>&copy; {year} Frô. Cuidado de plantas com IA.</p>;
}
