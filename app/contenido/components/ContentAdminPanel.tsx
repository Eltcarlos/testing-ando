"use client";

import { useEffect, useState } from "react";
import { BlogPostWithCategory, Category } from "@/types/editorial";
import ContentCard from "./ContentCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

export default function ContentAdminPanel() {
  const { data: session, status: sessionStatus } = useSession();
  const adminEmail = session?.user?.email;

  const [posts, setPosts] = useState<BlogPostWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const ITEMS_PER_PAGE = 12;

  const fetchCategories = async () => {
    if (!adminEmail) return;

    try {
      const response = await fetch(
        `/api/admin/content/categories?adminEmail=${encodeURIComponent(adminEmail)}`
      );
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Error al cargar categorías");
    }
  };

  const fetchPosts = async () => {
    if (!adminEmail) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        adminEmail,
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
      });

      if (selectedCategory !== "all") {
        params.append("category", selectedCategory);
      }

      if (selectedStatus !== "all") {
        params.append("status", selectedStatus);
      }

      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      // Fetch both posts and categories in parallel
      const [postsResponse, categoriesResponse] = await Promise.all([
        fetch(`/api/admin/content/posts?${params}`),
        fetch(`/api/admin/content/categories?adminEmail=${encodeURIComponent(adminEmail)}`)
      ]);

      if (!postsResponse.ok) throw new Error("Failed to fetch posts");
      if (!categoriesResponse.ok) throw new Error("Failed to fetch categories");

      const postsData = await postsResponse.json();
      const categoriesData = await categoriesResponse.json();

      // Enrich posts with category data (since we removed the relation)
      const enrichedPosts = postsData.posts.map((post: any) => {
        const category = categoriesData.find((cat: Category) => cat.id === post.categoryId);

        if (!category) {
          console.warn(`Category not found for post ${post.id}, categoryId: ${post.categoryId}`);
        }

        return {
          ...post,
          category: category || {
            id: post.categoryId,
            label: 'Sin categoría',
            slug: 'sin-categoria',
            icon: 'HelpCircle',
          },
        };
      });

      setPosts(enrichedPosts);
      setTotalPages(postsData.pagination.totalPages);
      setTotal(postsData.pagination.total);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Error al cargar contenidos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [adminEmail]);

  useEffect(() => {
    // Only fetch posts after categories are loaded
    if (categories.length > 0) {
      fetchPosts();
    }
  }, [adminEmail, currentPage, selectedCategory, selectedStatus, categories]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchPosts();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPage === 1) {
      fetchPosts();
    } else {
      setCurrentPage(1);
    }
  };

  const handleRefresh = () => {
    fetchPosts();
  };

  // Show loading state while fetching admin email
  if (sessionStatus === "loading") {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar por título, contenido o tema..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </form>

          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="draft">Borrador</SelectItem>
              <SelectItem value="published">Publicado</SelectItem>
              <SelectItem value="archived">Archivado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>
            {total} {total === 1 ? "resultado" : "resultados"}
          </span>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Empty State */}
      {!loading && posts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">
            {searchQuery || selectedCategory !== "all" || selectedStatus !== "all"
              ? "No se encontraron resultados"
              : "No hay contenido aún"}
          </p>
          {searchQuery || selectedCategory !== "all" || selectedStatus !== "all" ? (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedStatus("all");
                setCurrentPage(1);
              }}
            >
              Limpiar filtros
            </Button>
          ) : null}
        </div>
      )}

      {/* Posts Grid */}
      {!loading && posts.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <ContentCard key={post.id} post={post} onUpdate={handleRefresh} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>

              <span className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
