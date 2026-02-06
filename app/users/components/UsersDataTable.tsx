'use client';

import { useState, useEffect } from 'react';
import {
  flexRender,
  getCoreRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import type { AdminUser, AliadosInvitationStatus } from '@/types/admin';
import { getUserColumns } from './users-columns';

interface UsersDataTableProps {
  onView: (user: AdminUser) => void;
  onEdit: (user: AdminUser) => void;
  onToggleStatus: (user: AdminUser) => void;
  onSendAliadosForm?: (user: AdminUser) => void;
  aliadosInvitations?: Record<string, AliadosInvitationStatus>;
}

export function UsersDataTable({
  onView,
  onEdit,
  onToggleStatus,
  onSendAliadosForm,
  aliadosInvitations
}: UsersDataTableProps) {
  const [data, setData] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});

  // Server-side state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPageIndex(0); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(pageIndex + 1),
        limit: String(pageSize),
      });

      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }

      if (roleFilter && roleFilter !== 'all') {
        params.append('role', roleFilter);
      }

      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/users?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const result = await response.json();
      const apiUsers = result.data || result;
      const total = result.total || apiUsers.length;

      const mapped = apiUsers.map((u: any) => ({
        id: u.id,
        name: u.fullName || u.name || u.email,
        email: u.email,
        avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.fullName || u.email)}`,
        role: u.role,
        company: u.companyName || u.company || '',
        phone: u.phone || '',
        status: u.status || 'active',
        joinedAt: u.createdAt ? new Date(u.createdAt) : new Date(),
        lastActive: u.updatedAt ? new Date(u.updatedAt) : new Date(),
        metrics: u.metrics || {
          coursesEnrolled: 0,
          coursesCompleted: 0,
          connectionsCount: 0,
          eventsAttended: 0,
          messagesCount: 0,
        },
        settings: u.settings || {
          emailNotifications: true,
          profileVisibility: 'public',
          allowMessages: true,
        },
      } as AdminUser));

      setData(mapped);
      setTotalRecords(total);
      setTotalPages(Math.ceil(total / pageSize));
    } catch (error) {
      console.error('Error fetching users:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when filters or pagination change
  useEffect(() => {
    fetchData();
  }, [debouncedSearch, roleFilter, statusFilter, pageIndex, pageSize]);

  const columns = getUserColumns({
    onView,
    onEdit,
    onToggleStatus,
    onSendAliadosForm,
    aliadosInvitations
  });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      rowSelection,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
  });

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setPageIndex(0);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPageIndex(0);
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setPageIndex(0);
  };

  const handlePreviousPage = () => {
    if (pageIndex > 0) {
      setPageIndex(pageIndex - 1);
    }
  };

  const handleNextPage = () => {
    if (pageIndex < totalPages - 1) {
      setPageIndex(pageIndex + 1);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o empresa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={handleRoleFilterChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los roles</SelectItem>
            <SelectItem value="member">Miembros</SelectItem>
            <SelectItem value="admin">Administradores</SelectItem>
            <SelectItem value="partner">Aliados</SelectItem>
            <SelectItem value="strategic_partner">Aliados Estratégicos</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={handleStatusFilterChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
            <SelectItem value="suspended">Suspendidos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} de{' '}
          {totalRecords} fila(s) seleccionada(s).
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">Filas por página</p>
            <Select
              value={`${pageSize}`}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 25, 50, 100].map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={pageIndex === 0 || loading}
            >
              Anterior
            </Button>
            <div className="text-sm font-medium">
              Página {pageIndex + 1} de {totalPages || 1}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={pageIndex >= totalPages - 1 || loading}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

