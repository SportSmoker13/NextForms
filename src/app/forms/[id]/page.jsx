// app/forms/[id]/page.jsx
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Button } from '../../../components/ui/button';
import FormFiller from '../../../components/forms/form-filler';
import { Badge } from '../../../components/ui/badge';
import { Pencil, Eye, ClipboardList, Share2, ToggleRight } from 'lucide-react';
import { Input } from '../../../components/ui/input';

export async function generateMetadata(data) {
  const params = await data.params;
  const form = await prisma.form.findUnique({
    where: { id: params.id },
    select: { title: true, description: true }
  });

  return {
    title: form?.title || 'Form Not Found',
    description: form?.description || ''
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
        orderBy: { order: 'asc' }
      },
      _count: { select: { responses: true } }
    }
  });

  if (!form || form.creatorId !== session.user.id) notFound();

  async function togglePublish(status) {
    'use server';
    await prisma.form.update({
      where: { id: params.id },
      data: { published: status }
    });
    redirect(`forms/${params.id}`)
  }

  return (
    <div className="container py-8 px-4 space-y-8">
      {/* Form Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">{form.title}</h1>
          <p className="text-muted-foreground">{form.description}</p>
          <div className="flex items-center gap-2">
            <Badge variant={form.published ? 'success' : 'secondary'}>
              {form.published ? 'Published' : 'Draft'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {form._count.responses} responses
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button className='cursor-pointer' asChild variant="outline">
            <a href={`/forms/${form.id}/fill`} target="_blank">
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </a>
          </Button>
          <Button className='cursor-pointer' asChild>
            <a href={`/forms/${form.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </a>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Preview */}
        <div className="lg:col-span-2">
          <div className="sticky top-8">
            <h2 className="text-xl font-semibold mb-2 px-8">Form Preview</h2>
            <FormFiller 
              form={form} 
              previewMode 
              className="pointer-events-none opacity-75"
            />
            {!form.published && (
              <div className="mt-4 text-center text-muted-foreground">
                Form is not published - preview only
              </div>
            )}
          </div>
        </div>

        {/* Form Management Sidebar */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Form Actions</h2>
            <form action={togglePublish.bind(null, !form.published)}>
              <Button 
                type="submit"
                variant="outline"
                className="w-full cursor-pointer justify-start"
              >
                <ToggleRight className="mr-2 h-4 w-4" />
                {form.published ? 'Unpublish Form' : 'Publish Form'}
              </Button>
            </form>
            <Button 
              variant="outline" 
              className="w-full cursor-pointer justify-start"
              asChild
            >
              <a href={`/forms/${form.id}/responses`}>
                <ClipboardList className="mr-2 h-4 w-4" />
                View Responses
              </a>
            </Button>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Share Form</h2>
            <div className="flex gap-2">
              <Input
                value={`${process.env.NEXTAUTH_URL}/forms/${form.id}/fill`}
                readOnly
              />
              {/* <Button
                variant="secondary"
                className='cursor-pointer'
                onClick={() => navigator.clipboard.writeText(
                  `${process.env.NEXTAUTH_URL}/forms/${form.id}/fill`
                )}
              >
                <Share2 className="h-4 w-4" />
              </Button> */}
            </div>
            {!form.published && (
              <p className="text-sm text-muted-foreground">
                Form must be published to be shareable
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}