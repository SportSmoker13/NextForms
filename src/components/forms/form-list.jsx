// components/forms/form-list.jsx
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
import { Card, CardContent } from '../../components/ui/card';
import { toast } from 'sonner';

export default function FormList({ initialForms }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formToDelete, setFormToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Server-side pagination state
  const [forms, setForms] = useState(initialForms.data || []);
  const [totalForms, setTotalForms] = useState(initialForms.total || 0);
  const [currentPage, setCurrentPage] = useState(initialForms.page || 1);
  const [itemsPerPage] = useState(
    initialForms.pageSize || parseInt(process.env.ITEMS_PER_PAGE)
  );
  const [searchQuery, setSearchQuery] = useState(initialForms.search || '');

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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex justify-between flex-col h-full m-4">
      <div className="space-y-2 pb-4">
        <div className="flex items-center justify-between mx-4">
          <h1 className="text-2xl font-semibold">Your Forms</h1>
          <Button
            className="px-4 py-2 bg-[#003f7f] text-white rounded-md hover:bg-[#00264d] focus:ring-2 focus:ring-[#003f7f] cursor-pointer"
            onClick={() => router.push('/forms/create')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Form
          </Button>
        </div>

        <div className="relative mx-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search forms..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <Card className="grow">
          <CardContent className="p-0">
            <div className="border-b bg-muted/50 p-4">
              <div className="flex items-center text-sm font-medium text-muted-foreground">
                <div className="w-6/12">FORM NAME</div>
                <div className="w-2/12 text-center">RESPONSES</div>
                <div className="w-2/12 text-center hidden sm:block">STATUS</div>
                <div className="w-2/12 text-center">CREATED</div>
                <div className="w-2/12 text-right">ACTIONS</div>
              </div>
            </div>

            {forms.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                {searchQuery
                  ? 'No forms match your search'
                  : "You haven't created any forms yet"}
              </div>
            ) : (
              <div className="max-h-[61vh] overflow-y-scroll divide-y">
                {forms.map((form, key) => (
                  <div
                    key={key}
                    className="flex items-center p-4 hover:bg-muted/50"
                  >
                    <div className="w-6/12">
                      <div className="flex items-center">
                        <FileText className="mr-3 h-5 w-5 text-primary" />
                        <div>
                          <div className="font-medium">{form.title}</div>
                          <div className="hidden sm:block text-sm text-muted-foreground">
                            {form.description}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="w-2/12 text-center">
                      <Badge
                        variant="secondary"
                        className="bg-[#66b3ff] text-[#00264d]"
                      >
                        {form._count?.responses || 0}
                      </Badge>
                    </div>
                    <div className="w-2/12 text-center hidden sm:block">
                      <Badge
                        variant={form.published ? 'default' : 'secondary'}
                        className={
                          form.published
                            ? 'bg-green-100 text-green-800'
                            : 'bg-amber-100 text-amber-800'
                        }
                      >
                        {form.published ? 'Active' : 'Draft'}
                      </Badge>
                    </div>
                    <div className="w-2/12 text-center text-sm text-muted-foreground">
                      {formatDate(form.createdAt)}
                    </div>
                    <div className="w-2/12 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          className="cursor-pointer"
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/forms/${form.id}/edit`)}
                        >
                          <Edit className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/forms/${form.id}/responses`}>
                            <BarChart className="h-4 w-4 text-muted-foreground" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/forms/${form.id}`}>
                            <EyeIcon className="h-4 w-4 text-muted-foreground" />
                          </Link>
                        </Button>
                        <Button
                          className="cursor-pointer"
                          variant="ghost"
                          size="icon"
                          onClick={() => setFormToDelete(form)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialog
          open={!!formToDelete}
          onOpenChange={() => !isDeleting && setFormToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{formToDelete?.title}"? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
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

      {/* Pagination */}
      <div className="fixed inset-x-0 bottom-0 bg-white border-t">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing{' '}
            <span className="font-medium">
              {(currentPage - 1) * itemsPerPage + 1}
            </span>{' '}
            to{' '}
            <span className="font-medium">
              {Math.min(currentPage * itemsPerPage, totalForms)}
            </span>{' '}
            of <span className="font-medium">{totalForms}</span> results
          </div>
          <div className="flex items-center">
            <nav className="isolate inline-flex -space-x-px gap-2">
              <Button
                variant="outline"
                size="sm"
                className={`rounded-l-md px-2 ${currentPage === 1 ? 'cursor-not-allowed' : 'cursor-pointer'}`}
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
                        ? 'bg-[#003366] text-white hover:bg-[#00264d]'
                        : ''
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
                className="rounded-r-md px-2"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
