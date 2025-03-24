import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '..//lib/auth';
import prisma from '../../lib/prisma';
import FormList from '@/components/forms/form-list';

export const metadata = {
  title: 'My Forms | Form Builder',
  description: 'View and manage your created forms'
};

// app/forms/page.jsx
export default async function FormsPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/api/auth/signin');
  }
  const params = await searchParams;
  // Get search parameter
  const search = params.search || '';
  
  // Pagination parameterss
  const page = Number(params.page) || 1;
  const pageSize = Number(params.pageSize) || Number(process.env.ITEMS_PER_PAGE);

  // Validate parameters
  if (isNaN(page) || page < 1 || isNaN(pageSize) || pageSize < 1) {
    redirect(`/forms?page=1&pageSize=${Number(process.env.ITEMS_PER_PAGE)}`);
  }

  // Build where clause
  const where = {
    creatorId: session.user.id,
    OR: [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ]
  };

  const [forms, total] = await Promise.all([
    prisma.form.findMany({
      where,
      include: { _count: { select: { responses: true } }},
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.form.count({ where })
  ]);

  return (
    <div className="container py-8 px-4">
      <FormList 
        initialForms={{ 
          data: forms,
          total,
          page,
          pageSize,
          search 
        }} 
      />
    </div>
  );
}