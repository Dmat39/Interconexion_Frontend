import { ESTADO_BADGE } from '@/lib/constants';

interface Props {
  estado: string;
  className?: string;
}

export default function BadgeEstado({ estado, className = '' }: Props) {
  const cls = ESTADO_BADGE[estado] || 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls} ${className}`}>
      {estado}
    </span>
  );
}
