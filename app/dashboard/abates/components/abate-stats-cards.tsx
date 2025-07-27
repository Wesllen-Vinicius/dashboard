'use client';

import { motion } from 'framer-motion';
import { IconScale, IconTransform, IconMeat, IconPercentage } from '@tabler/icons-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Abate } from '@/lib/schemas';
import { useMemo } from 'react';

interface AbateStatsCardsProps {
  abates: Abate[];
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: 'easeOut',
    },
  }),
};

export function AbateStatsCards({ abates }: AbateStatsCardsProps) {
  const stats = useMemo(() => {
    // usa numeroAnimais em vez de "total", que não existe
    const totalAnimais = abates.reduce((acc, abate) => acc + abate.numeroAnimais, 0);
    const totalCondenados = abates.reduce((acc, abate) => acc + (abate.condenado || 0), 0);
    const animaisValidos = totalAnimais - totalCondenados;
    const taxaCondenacao = totalAnimais > 0 ? (totalCondenados / totalAnimais) * 100 : 0;

    return { totalAnimais, totalCondenados, animaisValidos, taxaCondenacao };
  }, [abates]);

  const cards = [
    {
      title: 'Animais Abatidos',
      value: stats.totalAnimais.toLocaleString('pt-BR'),
      icon: IconScale,
    },
    {
      title: 'Animais Válidos',
      value: stats.animaisValidos.toLocaleString('pt-BR'),
      icon: IconMeat,
    },
    {
      title: 'Animais Condenados',
      value: stats.totalCondenados.toLocaleString('pt-BR'),
      icon: IconTransform,
    },
    {
      title: 'Taxa de Condenação',
      value: `${stats.taxaCondenacao.toFixed(2)}%`,
      icon: IconPercentage,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.title}
          custom={i}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
