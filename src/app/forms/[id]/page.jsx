import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Button } from '../../../components/ui/button';
import FormFiller from '../../../components/forms/form-filler';
import { Badge } from '../../../components/ui/badge';
import {
  Pencil,
  Eye,
  ClipboardList,
  ToggleRight,
  Link as LinkIcon,
  ArrowUpRight,
} from 'lucide-react';
import { Input } from '../../../components/ui/input';
import CopyButton from '../../../components/ui/copy-button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { revalidatePath } from 'next/cache';

export async function generateMetadata(data) {
  const params = await data.params;
  const form = await prisma.form.findUnique({
    where: { id: params.id },
    select: { title: true, description: true },
  });

  return {
    title: form?.title || 'Form Not Found',
    description: form?.description || '',
  };
}

export default async function FormViewPage(data) {
  const params = await data.params;
  const session = await getServerSession(authOptions);
  if (!session) redirect('/api/auth/signin');

  const form = await prisma.form.findUnique({
    where: { id: params.id },
    include: {
      questions: {
        include: { options: true },
        orderBy: { order: 'asc' },
      },
      _count: { select: { responses: true } },
    },
  });

  if (!form || form.creatorId !== session.user.id) notFound();

  async function togglePublish() {
    'use server';
    const updatedForm = await prisma.form.update({
      where: { id: params.id },
      data: { published: !form.published },
    });

    // Revalidate the current path to refresh the page
    revalidatePath(`/forms/${params.id}`);

    return updatedForm.published;
  }
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-black dark:text-white p-4 w-full">
      <div className="w-full mx-auto space-y-6 max-w-7xl">
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-100 dark:border-gray-700 p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Form Title and Description */}
            <div className="flex-grow space-y-3">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white tracking-tight">
                  {form.title}
                </h1>
              </div>
              {form.description && (
                <p className="text-gray-600 dark:text-gray-300 max-w-2xl">
                  {form.description}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
              <Badge
                variant="outline"
                className="text-sm text-black dark:text-white font-normal border-gray-400 dark:border-gray-600"
              >
                Created on {new Date(form.createdAt).toLocaleDateString()}
              </Badge>
              <Badge
                variant="filled"
                className={`text-sm text-white font-normal ${
                  form.published
                    ? 'bg-green-600 dark:bg-green-700'
                    : 'bg-gray-500 dark:bg-gray-700'
                }`}
              >
                {form.published ? 'Published' : 'Draft'}
              </Badge>

              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto 
                    text-black bg-white 
                    hover:bg-gray-100 
                    dark:text-white dark:bg-gray-700 
                    dark:hover:bg-gray-600"
                  asChild
                >
                  <a href={`/forms/${form.id}/fill`} target="_blank">
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                    <ArrowUpRight className="ml-2 h-4 w-4 opacity-70" />
                  </a>
                </Button>
                <Button
                  className="w-full sm:w-auto 
                    bg-blue-600 hover:bg-blue-700 
                    dark:bg-blue-800 dark:hover:bg-blue-900 
                    text-white"
                  asChild
                >
                  <a href={`/forms/${form.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Form
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Form Management Sidebar */}
          <div className="md:col-span-1 space-y-6 gap-2">
            {/* Publish Toggle */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-4 m-0 mb-4">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-800 dark:text-white">
                  <ToggleRight className="mr-2 h-5 w-5 text-gray-600 dark:text-gray-400" />
                  Form Visibility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form action={togglePublish} className="w-full">
                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full justify-start 
                      text-black bg-white hover:bg-gray-100 
                      dark:text-white dark:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    {form.published ? 'Unpublish Form' : 'Publish Form'}
                  </Button>
                </form>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {form.published
                    ? 'Form is visible to respondents'
                    : 'Form is currently private'}
                </p>
              </CardContent>
            </Card>

            {/* Share Form */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-4 m-0 mb-4">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-800 dark:text-white">
                  <LinkIcon className="mr-2 h-5 w-5 text-gray-600 dark:text-gray-400" />
                  Share Form
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <Input
                    value={`${process.env.NEXTAUTH_URL}/forms/${form.id}/fill`}
                    readOnly
                    className="flex-grow 
                      bg-gray-100 text-black border-gray-300 
                      dark:bg-gray-700 dark:text-white dark:border-gray-600 
                      mb-2 sm:mb-0"
                  />
                  <CopyButton
                    text={`${process.env.NEXTAUTH_URL}/forms/${form.id}/fill`}
                  />
                </div>
                {!form.published && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                    Form must be published to be shareable
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Responses */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-4 m-0 mb-4">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-800 dark:text-white">
                  <ClipboardList className="mr-2 h-5 w-5 text-gray-600 dark:text-gray-400" />
                  Form Responses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full justify-start 
                    text-black bg-white hover:bg-gray-100 
                    dark:text-white dark:bg-gray-700 dark:hover:bg-gray-600"
                  asChild
                >
                  <a href={`/forms/${form.id}/responses`}>View All Responses</a>
                </Button>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Total Responses: <strong>{form._count.responses}</strong>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Last Response:{' '}
                    {form._count.responses > 0
                      ? new Date(form.lastResponseAt).toLocaleString()
                      : 'No responses yet'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form Preview */}
          <div className="md:col-span-2">
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden m-0 gap-0">
              <CardHeader className="bg-gray-50 dark:bg-gray-900 py-8 border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="flex items-center justify-between text-gray-800 dark:text-white">
                  <span>Form Preview</span>
                  {!form.published && (
                    <Badge
                      variant="destructive"
                      className="text-xs bg-red-500 dark:bg-red-700"
                    >
                      Draft Mode
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[700px] w-full">
                  <FormFiller
                    form={form}
                    previewMode
                    className="pointer-events-none opacity-75"
                  />
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
