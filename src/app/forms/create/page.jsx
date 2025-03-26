// app/forms/create/page.jsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import FormBuilder from '@/components/forms/form-builder';
import { Card } from '@/components/ui/card';

export const metadata = {
  title: 'Create Form | Form Builder',
  description: 'Create a new custom form',
};

export default async function CreateFormPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/api/auth/signin');
  }

  return (
    <Card className="m-0 w-full rounded-none">
      <div className="container p-4">
        <h1 className="text-3xl font-bold">Create New Form</h1>
        <FormBuilder />
      </div>
    </Card>
  );
}
