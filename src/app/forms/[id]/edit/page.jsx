// app/forms/[id]/edit/page.jsx
import { getServerSession } from 'next-auth';
import { notFound, redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import FormBuilder from '@/components/forms/form-builder';
import { Card } from '@/components/ui/card';

export const metadata = {
  title: 'Edit Form | Form Builder',
  description: 'Edit your existing form',
};

export default async function EditFormPage(data) {
  const params = await data.params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/api/auth/signin');
  }

  const form = await prisma.form.findUnique({
    where: { id: params.id },
    include: {
      questions: {
        include: { options: true },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!form || form.creatorId !== session.user.id) {
    notFound();
  }

  return (
    <Card className="w-full m-0 rounded-none">
      <div className="container py-4 px-4">
        <h1 className="text-3xl font-bold mb-8">Edit Form</h1>
        <FormBuilder formData={form} />
      </div>
    </Card>
  );
}
