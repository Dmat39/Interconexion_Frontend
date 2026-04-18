'use client';
import { usePathname } from 'next/navigation';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/vecinos': 'Vecinos',
  '/visitas': 'Visitas',
  '/mapa': 'Mapa',
  '/recuperaciones': 'Recuperaciones',
  '/importar': 'Importar',
  '/reportes': 'Reportes',
  '/configuracion': 'Configuración',
};

function getTitle(pathname: string): string {
  for (const [key, label] of Object.entries(PAGE_TITLES)) {
    if (pathname === key || pathname.startsWith(key + '/')) return label;
  }
  return 'SIVI';
}

export default function Header() {
  const pathname = usePathname();
  const title = getTitle(pathname);

  return (
    <header className="bg-green-700 text-white px-6 py-4 flex items-center justify-between shadow-sm flex-shrink-0">
      <h1 className="text-lg font-bold tracking-tight">{title}</h1>
      <div className="text-xs text-green-200 font-medium">CECOM · SJL</div>
    </header>
  );
}
