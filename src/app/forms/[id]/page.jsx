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
import { Separator } from '../../../components/ui/separator';
import { ScrollArea } from '../../../components/ui/scroll-area';

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
    return updatedForm.published;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 w-full">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Form Title and Description */}
            <div className="flex-grow space-y-3">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
                  {form.title}
                </h1>
                <Badge
                  className={`transform scale-90 ${form.published ? 'bg-[green-500]' : 'secondary'}`}
                >
                  {form.published ? 'Published' : 'Draft'}
                </Badge>
              </div>
              {form.description && (
                <p className="text-gray-600 max-w-2xl">{form.description}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col items-start md:flex-row gap-3">
              <Badge
                variant="outline"
                className="ml-3 text-sm text-[black] font-normal border-slate-500"
              >
                Created on {new Date(form.createdAt).toLocaleDateString()}
              </Badge>
              <Badge
                variant="filled"
                className={`ml-3 text-sm text-[white] font-normal ${form.published ? 'bg-green-700' : 'bg-slate-500'}`}
              >
                {form.published ? 'Published' : 'Draft'}
              </Badge>

              <Button variant="outline" className="w-full md:w-auto" asChild>
                <a href={`/forms/${form.id}/fill`} target="_blank">
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                  <ArrowUpRight className="ml-2 h-4 w-4 opacity-70" />
                </a>
              </Button>
              <Button className="w-full md:w-auto" asChild>
                <a href={`/forms/${form.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Form
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid md:grid-cols-3">
          {/* Form Management Sidebar */}
          <div className="md:col-span-1 space-y-6">
            {/* Publish Toggle */}
            <Card className="py-4">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ToggleRight className="mr-2 h-5 w-5 text-gray-600" />
                  Form Visibility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form action={togglePublish} className="w-full">
                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full justify-start"
                  >
                    {form.published ? 'Unpublish Form' : 'Publish Form'}
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground mt-2">
                  {form.published
                    ? 'Form is visible to respondents'
                    : 'Form is currently private'}
                </p>
              </CardContent>
            </Card>

            {/* Share Form */}
            <Card className="py-4">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LinkIcon className="mr-2 h-5 w-5 text-gray-600" />
                  Share Form
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Input
                    value={`${process.env.NEXTAUTH_URL}/forms/${form.id}/fill`}
                    readOnly
                    className="flex-grow"
                  />
                  <CopyButton
                    text={`${process.env.NEXTAUTH_URL}/forms/${form.id}/fill`}
                  />
                </div>
                {!form.published && (
                  <p className="text-xs text-destructive mt-2">
                    Form must be published to be shareable
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Responses */}
            <Card className="py-4">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ClipboardList className="mr-2 h-5 w-5 text-gray-600" />
                  Form Responses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <a href={`/forms/${form.id}/responses`}>View All Responses</a>
                </Button>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Total Responses: <strong>{form._count.responses}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground">
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
            <Card className="overflow-hidden  gap-0">
              <CardHeader className="bg-gray-50 py-8 border-b">
                <CardTitle className="flex items-center justify-between">
                  <span>Form Preview</span>
                  {!form.published && (
                    <Badge variant="destructive" className="text-xs">
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
