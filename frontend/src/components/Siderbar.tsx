"use client";

import { usePathname } from "next/navigation";
import { Users, Building, LayoutDashboard, BarChart2, Bot, Settings, FileText, Info, Shield, Lock, LifeBuoy, LogOut, X } from 'lucide-react'; // Adicionar o ícone X
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useAI } from "@/contexts/AIContext";

// Definindo a hierarquia de papéis para facilitar a verificação
const ROLE_HIERARCHY = {
  viewer: 1,
  operator: 2,
  admin: 3,
  super_admin: 4,
};
type UserRole = keyof typeof ROLE_HIERARCHY;


interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  minRole: UserRole;
}

const mainNavItems: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Painel Principal", minRole: "viewer" },
  { href: "/dashboard/host-analysis", icon: BarChart2, label: "Análise de Host", minRole: "viewer" },
  { href: "/dashboard/reports", icon: FileText, label: "Gerar Relatórios", minRole: "viewer" },
  { href: "/dashboard/companies", icon: Building, label: "Gerenciar Empresas", minRole: "admin" },
  { href: "/dashboard/manage-users", icon: Users, label: "Gerenciar Usuários", minRole: "super_admin" },
  //{ href: "/dashboard/settings", icon: Settings, label: "Configurações", minRole: "viewer" },
];

const bottomNavItems = [
    { href: "/dashboard/about", icon: Info, label: "Sobre" },
    { href: "/dashboard/privacy", icon: Shield, label: "Privacidade" },
    { href: "/dashboard/responsibility", icon: Lock, label: "Responsabilidade" },
    { href: "/dashboard/help", icon: LifeBuoy, label: "Ajuda" },
];

// Tipagem para as props do componente
interface SiderbarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Siderbar = ({ isOpen, setIsOpen }: SiderbarProps) => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { toggle: toggleAIWindow } = useAI();
  const [visibleNavItems, setVisibleNavItems] = useState<NavItem[]>([]);

  useEffect(() => {
    const userRole = session?.user?.role as UserRole | undefined;
    const userLevel = userRole ? ROLE_HIERARCHY[userRole] : 0;

    if (userLevel > 0) {
        const filteredItems = mainNavItems.filter(item => userLevel >= ROLE_HIERARCHY[item.minRole]);
        setVisibleNavItems(filteredItems);
    }
  }, [session]);

  return (
    <>
      {/* Overlay para telas pequenas */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden ${isOpen ? 'block' : 'hidden'}`}
        onClick={() => setIsOpen(false)}
      ></div>

      <aside className={`fixed md:relative top-0 left-0 h-full w-64 bg-indigo-800 border-r border-indigo-700 rtl:border-r-0 rtl:border-l text-gray-300 flex flex-col p-4 z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="flex justify-between items-center mb-10">
            <div className="text-2xl font-bold text-white">InfraSense</div>
            {/* Botão para fechar a sidebar em telas pequenas */}
            <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-300 hover:text-white">
                <X size={24} />
            </button>
        </div>
        
        <div className="flex flex-col justify-between flex-grow overflow-y-auto">
          <nav>
            <ul>
              {visibleNavItems.map(({ href, icon: Icon, label }) => (
                <li key={href} className="mb-2">
                  <Link href={href} className={`flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors ${pathname === href ? 'bg-blue-600 text-white' : ''}`}>
                    <Icon className="mr-3" size={20} />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav>
              <ul>
                  {bottomNavItems.map(({ href, icon: Icon, label }) => (
                      <li key={href} className="mb-2">
                          <Link href={href} className={`flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors ${pathname === href ? 'bg-gray-700' : ''}`}>
                              <Icon className="mr-3" size={20} />
                              {label}
                          </Link>
                      </li>
                  ))}
                  <li className="mb-2">
                      <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full flex items-center p-3 rounded-lg hover:bg-gray-700 transition-colors">
                          <LogOut className="mr-3" size={20} />
                          Sair
                      </button>
                  </li>
              </ul>
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Siderbar;