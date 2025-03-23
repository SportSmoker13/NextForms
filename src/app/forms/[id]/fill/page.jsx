// app/forms/[id]/fill/page.jsx
import { getServerSession } from 'next-auth';
import { notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import FormFiller from '@/components/forms/form-filler';

export async function generateMetadata({ params }) {
  const form = await prisma.form.findUnique({
    where: { id: params.id },
    select: { title: true }
  });

  return {
    title: form ? `${form.title} | Form Builder` : 'Form Not Found',
    description: form?.title ? `Fill out the ${form.title} form` : ''
  };
}

export default async function FillFormPage({ params }) {
  const session = await getServerSession(authOptions);
  
  const form = await prisma.form.findUnique({
    where: { id: params.id },
    include: {
      questions: {
        include: { options: true },
        orderBy: { order: 'asc' }
      }
    }
  });

  if (!form || (!form.published && form.creatorId !== session?.user?.id)) {
    notFound();
  }

  return (
    <div className="container py-8 px-4">
      <FormFiller form={form} />
    </div>
  );
}