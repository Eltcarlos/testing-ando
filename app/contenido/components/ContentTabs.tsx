"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from '@/store/authStore';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface ContentTabsProps {
  createAITab: React.ReactNode;
  createHumanTab: React.ReactNode;
  adminTab: React.ReactNode;
  reviewTab: React.ReactNode;
}

export default function ContentTabs({ createAITab, createHumanTab, adminTab, reviewTab }: ContentTabsProps) {
  const [activeTab, setActiveTab] = useState<"crear-ia" | "crear-humano" | "administrar" | "revisar">("crear-humano");
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  // Check URL params for initial tab
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'admin') {
        setActiveTab('administrar');
      } else if (tab === 'human') {
        setActiveTab('crear-humano');
      } else if (tab === 'review') {
        setActiveTab('revisar');
      }
    }
  }, []);

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
      <TabsList className="w-fit">
        {isAdmin && (
          <TabsTrigger value="crear-ia">
            Crear con IA
          </TabsTrigger>
        )}
        <TabsTrigger value="crear-humano">
          Crear Contenido
        </TabsTrigger>
        <TabsTrigger value="administrar">
          Administrar
        </TabsTrigger>
        {isAdmin && (
          <TabsTrigger value="revisar">
            Moderacion
          </TabsTrigger>
        )}
      </TabsList>

      {isAdmin && (
        <TabsContent value="crear-ia" className="mt-6">
          {createAITab}
        </TabsContent>
      )}
      <TabsContent value="crear-humano" className="mt-6">
        {createHumanTab}
      </TabsContent>
      <TabsContent value="administrar" className="mt-6">
        {adminTab}
      </TabsContent>
      {isAdmin && (
        <TabsContent value="revisar" className="mt-6">
          {reviewTab}
        </TabsContent>
      )}
    </Tabs>
  );
}
