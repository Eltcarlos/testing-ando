import {
  BarChart3,
  GraduationCap,
  Video,
  Users,
  FileText,
  ClipboardList,
  HelpCircle,
} from "lucide-react";
import type { AdminUser } from "@/types/admin";

export interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  allowedRoles: AdminUser["role"][];
}

export const navigationItems: NavigationItem[] = [
  {
    name: "Análisis",
    href: "/analytics",
    icon: BarChart3,
    allowedRoles: [],
  },
  {
    name: "Cursos",
    href: "/cursos",
    icon: GraduationCap,
    allowedRoles: ["admin", "partner", "member", "strategic_partner"],
  },
  {
    name: "Videos",
    href: "/videos",
    icon: Video,
    allowedRoles: ["admin", "partner", "member", "strategic_partner"],
  },
  {
    name: "Usuarios",
    href: "/users",
    icon: Users,
    allowedRoles: ["admin"],
  },
  {
    name: "Contenido Editorial",
    href: "/contenido",
    icon: FileText,
    allowedRoles: ["admin", "partner", "strategic_partner"],
  },
  {
    name: "Formularios Fundadoras",
    href: "/founder-forms",
    icon: ClipboardList,
    allowedRoles: [],
  },
];

export function getNavigationForRole(role: AdminUser["role"]): NavigationItem[] {
  return navigationItems.filter((item) => item.allowedRoles.includes(role));
}

export function getRoleLabel(role: AdminUser["role"]): string {
  const labels: Record<AdminUser["role"], string> = {
    admin: "Administrador",
    strategic_partner: "Aliado Estratégico",
    partner: "Socio",
    member: "Miembro",
  };
  return labels[role];
}
