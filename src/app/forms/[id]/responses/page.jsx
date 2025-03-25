import React, { useMemo } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import ResponseList from '../../../../components/forms/response-list';

// Enhanced Response List Component
export default async function FormResponsesDashboard(data) {
  const params = await data.params;
  if (!params?.id) {
    notFound(); // Handle case where ID is missing
  }

  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/api/auth/signin');
  }

  const form = await prisma.form.findUnique({
    where: { id: params.id }, // Now safely accessing params.id
    include: {
      responses: {
        include: {
          answers: { include: { question: true } },
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      questions: true,
    },
  });

  if (!form || form.creatorId !== session.user.id) {
    notFound();
  }

  return (
    <div className="container space-y-2">
      <ResponseList form={form} responses={form.responses} />
    </div>
  );
}
