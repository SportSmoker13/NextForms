'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { redirect, useRouter, useSearchParams } from 'next/navigation';
import {
  Edit,
  FileText,
  Plus,
  Search,
  BarChart,
  ChevronLeft,
  ChevronRight,
  Trash2,
  EyeIcon,
  FilterIcon,
  Download,
  Users,
  Calendar,
  User,
  ChevronDown,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../../components/ui/sheet';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '../../components/ui/drawer';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { toast } from 'sonner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../components/ui/accordion';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const exportToCSV = (forms) => {
  // Basic CSV export implementation
  const headers = [
    'Title',
    'Status',
    'Responses',
    'Created At',
    'Last Updated',
  ];
  const csvContent = [
    headers.join(','),
    ...forms.map((form) =>
      [
        `"${form.title.replace(/"/g, '""')}"`,
        form.published ? 'Active' : 'Draft',
        form._count?.responses || 0,
        new Date(form.createdAt).toISOString(),
        new Date(form.updatedAt).toISOString(),
      ].join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `forms-export-${new Date().toISOString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function FormList({ initialForms }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formToDelete, setFormToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Server-side pagination state
  const [forms, setForms] = useState(initialForms.data || []);
  const [totalForms, setTotalForms] = useState(initialForms.total || 0);
  const [currentPage, setCurrentPage] = useState(initialForms.page || 1);
  const [itemsPerPage] = useState(
    initialForms.pageSize || parseInt(process.env.ITEMS_PER_PAGE)
  );
  const [searchQuery, setSearchQuery] = useState(initialForms.search || '');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState('updatedAt');
  const [sortDirection, setSortDirection] = useState('desc');

  const totalPages = Math.ceil(totalForms / itemsPerPage);

  useEffect(() => {
    setForms(initialForms.data);
  }, [initialForms.data]);

  const updateURLParams = (newParams) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(newParams).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    router.push(`/forms?${params.toString()}`);
  };

  useEffect(() => {
    if (initialForms.search) {
      setSearchQuery(initialForms.search);
    }
  }, [initialForms.search]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    updateURLParams({ search: query, page: 1 });
  };

  const handleFilterStatus = (status) => {
    setFilterStatus(status);
    updateURLParams({ status, page: 1 });
    setIsFilterSheetOpen(false);
    setIsMobileFilterOpen(false);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      const direction = sortDirection === 'asc' ? 'desc' : 'asc';
      setSortDirection(direction);
      updateURLParams({ sort: `${field}:${direction}`, page: 1 });
    } else {
      setSortField(field);
      setSortDirection('desc');
      updateURLParams({ sort: `${field}:desc`, page: 1 });
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    updateURLParams({ page: newPage });
  };

  const handlePreviousPage = () => {
    const newPage = Math.max(1, currentPage - 1);
    handlePageChange(newPage);
  };

  const handleNextPage = () => {
    const newPage = Math.min(totalPages, currentPage + 1);
    handlePageChange(newPage);
  };

  const handleDelete = async () => {
    if (!formToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/forms/${formToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete form');

      // Refresh forms after deletion
      const newResponse = await fetch(
        `/api/forms?page=${currentPage}&pageSize=${itemsPerPage}&search=${encodeURIComponent(searchQuery)}`
      );
      const { data, total } = await newResponse.json();

      setForms(data);
      setTotalForms(total);
      toast.warning('Form was successfully deleted');
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setFormToDelete(null);
      setIsDeleting(false);
    }
  };

  // Filter forms based on status
  const filteredForms = forms.filter(
    (form) =>
      filterStatus === 'all' ||
      (filterStatus === 'active' && form.published) ||
      (filterStatus === 'draft' && !form.published)
  );

  const formStats = {
    total: filteredForms.length,
    published: filteredForms.filter((f) => f.published).length,
    draft: filteredForms.filter((f) => !f.published).length,
    responses: filteredForms.reduce(
      (sum, form) => sum + (form._count?.responses || 0),
      0
    ),
    lastUpdated: filteredForms[0]?.updatedAt || null,
  };

  const handleRowClick = (id) => {
    router.push(`/forms/${id}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Content Container with Scrollable Body */}
      <div className="flex-grow overflow-auto px-4 pt-4 pb-20">
        {/* Header and Create Button */}
        <div className="space-y-4 pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold text-black dark:text-white">
              Your Forms
            </h1>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                className="px-4 py-2 bg-black dark:bg-blue-600 text-white rounded-md hover:bg-gray-900 dark:hover:bg-blue-700 focus:ring-2 focus:ring-black dark:focus:ring-blue-500 cursor-pointer grow sm:w-auto"
                onClick={() => router.push('/forms/create')}
              >
                <Plus className="mr-2 h-4" />
                <span className="whitespace-nowrap">Create New Form</span>
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
            {[
              {
                title: 'Total Forms',
                value: formStats.total,
                icon: FileText,
                bgColor: 'bg-black/10 dark:bg-blue-900/50',
                textColor: 'text-black dark:text-blue-200',
              },
              {
                title: 'Published',
                value: formStats.published,
                icon: Users,
                bgColor: 'bg-black/10 dark:bg-green-900/50',
                textColor: 'text-black dark:text-green-200',
              },
              {
                title: 'Drafts',
                value: formStats.draft,
                icon: User,
                bgColor: 'bg-black/10 dark:bg-yellow-900/50',
                textColor: 'text-black dark:text-yellow-200',
              },
              {
                title: 'Total Responses',
                value: formStats.responses,
                icon: BarChart,
                bgColor: 'bg-black/10 dark:bg-purple-900/50',
                textColor: 'text-black dark:text-purple-200',
              },
              {
                title: 'Last Updated',
                value: formStats.lastUpdated
                  ? formatDate(formStats.lastUpdated)
                  : 'N/A',
                icon: Calendar,
                bgColor: 'bg-black/10 dark:bg-indigo-900/50',
                textColor: 'text-black dark:text-indigo-200',
              },
            ].map(({ title, value, icon: Icon, bgColor, textColor }) => (
              <Card
                key={title}
                className={`flex flex-col m-0 p-3 hover:shadow-lg transition-shadow ${bgColor}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className={`text-xs md:text-sm ${textColor}`}>
                    {title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${textColor}`} />
                </div>
                <div className={`text-xl md:text-2xl font-bold ${textColor}`}>
                  {value}
                </div>
              </Card>
            ))}
          </div>

          {/* Search and Filter Container */}
          <div className="flex items-center gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-3 h-4 w-4 text-black/50 dark:text-white/50" />
              <Input
                placeholder="Search forms..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-black/20 dark:border-white/20 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-black/50 dark:placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-blue-500 focus:border-black dark:focus:border-blue-500 sm:text-sm"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsMobileFilterOpen(true)}
              className="sm:hidden border-black/20 dark:border-white/20 text-black dark:text-white"
            >
              <FilterIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Desktop Filter */}
          <div className="hidden sm:flex gap-2 mb-4">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              onClick={() => handleFilterStatus('all')}
              size="sm"
              className={
                filterStatus === 'all'
                  ? 'bg-black dark:bg-blue-600 text-white'
                  : 'border-black/20 dark:border-white/20 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10'
              }
            >
              All Forms
            </Button>
            <Button
              variant={filterStatus === 'active' ? 'default' : 'outline'}
              onClick={() => handleFilterStatus('active')}
              size="sm"
              className={
                filterStatus === 'active'
                  ? 'bg-black dark:bg-blue-600 text-white'
                  : 'border-black/20 dark:border-white/20 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10'
              }
            >
              Active Forms
            </Button>
            <Button
              variant={filterStatus === 'draft' ? 'default' : 'outline'}
              onClick={() => handleFilterStatus('draft')}
              size="sm"
              className={
                filterStatus === 'draft'
                  ? 'bg-black dark:bg-blue-600 text-white'
                  : 'border-black/20 dark:border-white/20 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10'
              }
            >
              Draft Forms
            </Button>
          </div>

          {/* Mobile Filter Drawer */}
          <Drawer
            open={isMobileFilterOpen}
            onOpenChange={setIsMobileFilterOpen}
          >
            <DrawerContent className="rounded-t-2xl bg-white dark:bg-gray-800">
              <DrawerHeader>
                <DrawerTitle className="text-black dark:text-white">
                  Filter Forms
                </DrawerTitle>
              </DrawerHeader>

              <div className="grid gap-2 p-4">
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  onClick={() => handleFilterStatus('all')}
                  className={`w-full ${filterStatus === 'all' ? 'bg-black dark:bg-blue-600 text-white' : 'border-black/20 dark:border-white/20 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10'}`}
                >
                  All Forms
                </Button>
                <Button
                  variant={filterStatus === 'active' ? 'default' : 'outline'}
                  onClick={() => handleFilterStatus('active')}
                  className={`w-full ${filterStatus === 'active' ? 'bg-black dark:bg-blue-600 text-white' : 'border-black/20 dark:border-white/20 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10'}`}
                >
                  Active Forms
                </Button>
                <Button
                  variant={filterStatus === 'draft' ? 'default' : 'outline'}
                  onClick={() => handleFilterStatus('draft')}
                  className={`w-full ${filterStatus === 'draft' ? 'bg-black dark:bg-blue-600 text-white' : 'border-black/20 dark:border-white/20 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10'}`}
                >
                  Draft Forms
                </Button>
              </div>

              <DrawerFooter className="bg-white dark:bg-gray-800">
                <DrawerClose asChild>
                  <Button className="bg-black dark:bg-blue-600 hover:bg-gray-900 dark:hover:bg-blue-700">
                    Apply Filters
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>

          {/* Forms List */}
          {filteredForms.length === 0 ? (
            <Card className="py-12 text-center text-muted-foreground bg-white dark:bg-gray-800">
              <div className="flex flex-col items-center justify-center">
                <AlertCircle className="h-12 w-12 text-black/50 dark:text-white/50 mb-4" />
                <h3 className="text-xl font-semibold text-black dark:text-white">
                  {searchQuery || filterStatus !== 'all'
                    ? 'No forms match your search or filter'
                    : "You haven't created any forms yet"}
                </h3>
                <p className="text-black/70 dark:text-white/70 mt-2">
                  {searchQuery || filterStatus !== 'all'
                    ? 'Try adjusting your filters or search terms'
                    : 'Click "Create New Form" to get started'}
                </p>
              </div>
            </Card>
          ) : (
            <Card className="w-full m-0 bg-white dark:bg-gray-800">
              <CardContent className="p-0">
                {/* Table Header for Desktop */}
                <div className="hidden sm:block border-b bg-black/10 dark:bg-white/10 p-3">
                  <div className="grid grid-cols-12 items-center text-xs font-medium text-black dark:text-white">
                    <div
                      className="col-span-4 pl-2 cursor-pointer hover:underline"
                      onClick={() => handleSort('title')}
                    >
                      FORM NAME{' '}
                      {sortField === 'title' &&
                        (sortDirection === 'asc' ? '↑' : '↓')}
                    </div>
                    <div
                      className="col-span-2 text-center cursor-pointer hover:underline"
                      onClick={() => handleSort('_count.responses')}
                    >
                      RESPONSES{' '}
                      {sortField === '_count.responses' &&
                        (sortDirection === 'asc' ? '↑' : '↓')}
                    </div>
                    <div
                      className="col-span-2 text-center cursor-pointer hover:underline"
                      onClick={() => handleSort('published')}
                    >
                      STATUS{' '}
                      {sortField === 'published' &&
                        (sortDirection === 'asc' ? '↑' : '↓')}
                    </div>
                    <div
                      className="col-span-2 text-center cursor-pointer hover:underline"
                      onClick={() => handleSort('updatedAt')}
                    >
                      LAST UPDATED{' '}
                      {sortField === 'updatedAt' &&
                        (sortDirection === 'asc' ? '↑' : '↓')}
                    </div>
                    <div className="col-span-2 text-right pr-2">ACTIONS</div>
                  </div>
                </div>

                <div>
                  {filteredForms.map((form, key) => (
                    <div
                      key={key}
                      className="block sm:grid sm:grid-cols-12 p-4 sm:p-3 hover:bg-black/5 dark:hover:bg-white/5 border-b last:border-b-0 border-black/10 dark:border-white/10 items-center"
                    >
                      {/* Mobile View */}
                      <div className="sm:hidden space-y-2">
                        <FileText className="h-20 w-20 text-black dark:text-white" />
                        <div className="flex items-center space-x-3">
                          <div>
                            <div className="font-medium text-black dark:text-white">
                              {form.title}
                            </div>
                            <div className="text-xs text-black/70 dark:text-white/70">
                              {form.description || 'No description'}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <Badge
                            variant={form.published ? 'default' : 'secondary'}
                            className={
                              form.published
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                : 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
                            }
                          >
                            {form.published ? 'Active' : 'Draft'}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                          >
                            {form._count?.responses || 0} Responses
                          </Badge>
                          <div className="text-xs text-black/70 dark:text-white/70">
                            {formatDate(form.updatedAt)}
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2 mt-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRowClick(form.id)}
                            className="text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              router.push(`/forms/${form.id}/edit`)
                            }
                            className="text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10"
                          >
                            <Link href={`/forms/${form.id}/responses`}>
                              <BarChart className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setFormToDelete(form)}
                            className="text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 hover:text-red-500 dark:hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Desktop View */}
                      <div className="hidden sm:contents">
                        <div
                          className="col-span-4 flex items-center space-x-3 pl-2 cursor-pointer"
                          onClick={() => handleRowClick(form.id)}
                        >
                          <FileText className="h-5 w-5 text-black dark:text-white" />
                          <div className="truncate">
                            <div className="font-medium truncate text-black dark:text-white">
                              {form.title}
                            </div>
                            <div className="text-xs text-black/70 dark:text-white/70 truncate">
                              {form.description || 'No description'}
                            </div>
                          </div>
                        </div>
                        <div className="col-span-2 flex justify-center">
                          <Badge
                            variant="secondary"
                            className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                          >
                            {form._count?.responses || 0}
                          </Badge>
                        </div>
                        <div className="col-span-2 flex justify-center">
                          <Badge
                            variant={form.published ? 'default' : 'secondary'}
                            className={
                              form.published
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                : 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
                            }
                          >
                            {form.published ? 'Active' : 'Draft'}
                          </Badge>
                        </div>
                        <div className="col-span-2 text-center text-sm text-black/70 dark:text-white/70">
                          {formatDate(form.updatedAt)}
                        </div>
                        <div className="col-span-2 flex justify-end space-x-1 pr-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRowClick(form.id)}
                            className="text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              router.push(`/forms/${form.id}/edit`)
                            }
                            className="text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10"
                          >
                            <Link href={`/forms/${form.id}/responses`}>
                              <BarChart className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setFormToDelete(form)}
                            className="text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 hover:text-red-500 dark:hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Delete Confirmation Dialog */}
          <AlertDialog
            open={!!formToDelete}
            onOpenChange={() => !isDeleting && setFormToDelete(null)}
          >
            <AlertDialogContent className="bg-white dark:bg-gray-800">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-black dark:text-white">
                  Confirm Deletion
                </AlertDialogTitle>
                <AlertDialogDescription className="text-black/70 dark:text-white/70">
                  Are you sure you want to delete "{formToDelete?.title}"? This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  disabled={isDeleting}
                  className="border-black/20 dark:border-white/20 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10"
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Sticky Pagination Container */}
      {filteredForms.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg z-50 p-4 border-t border-black/10 dark:border-white/10">
          <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-sm text-black/70 dark:text-white/70 text-center sm:text-left">
              Showing{' '}
              <span className="font-medium text-black dark:text-white">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{' '}
              to{' '}
              <span className="font-medium text-black dark:text-white">
                {Math.min(currentPage * itemsPerPage, totalForms)}
              </span>{' '}
              of{' '}
              <span className="font-medium text-black dark:text-white">
                {totalForms}
              </span>{' '}
              forms
            </div>
            <div className="flex items-center">
              <nav className="isolate inline-flex -space-x-px gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={`rounded-l-md px-2 ${currentPage === 1 ? 'cursor-not-allowed' : 'cursor-pointer'} border-black/20 dark:border-white/20 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10`}
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page, key) => (
                    <Button
                      key={key}
                      variant={currentPage === page ? 'solid' : 'outline'}
                      size="sm"
                      className={`px-4 ${page > 1 && page < totalPages ? 'hidden md:inline-flex' : ''} ${
                        currentPage === page
                          ? 'bg-black dark:bg-blue-600 text-white hover:bg-gray-900 dark:hover:bg-blue-700'
                          : 'border-black/20 dark:border-white/20 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10'
                      }`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  )
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-r-md px-2 border-black/20 dark:border-white/20 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
