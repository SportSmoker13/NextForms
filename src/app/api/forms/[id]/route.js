// app/api/forms/[id]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    const form = await prisma.form.findUnique({
      where: { id },
      include: {
        questions: {
          include: { options: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!form) {
      return NextResponse.json(
        { error: 'Form not found' }, 
        { status: 404 }
      );
    }

    return NextResponse.json(form);
  } catch (error) {
    console.error('Error fetching form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = params;
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Verify form ownership
    const existingForm = await prisma.form.findUnique({
      where: { id },
      select: { creatorId: true }
    });

    if (!existingForm || existingForm.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 403 }
      );
    }

    // Update form and questions in transaction
    const updatedForm = await prisma.$transaction(async (tx) => {
      // Update form details
      const form = await tx.form.update({
        where: { id },
        data: {
          title: body.title,
          description: body.description
        }
      });

      // Delete existing questions and options
      await tx.question.deleteMany({
        where: { formId: id }
      });

      // Create new questions
      await Promise.all(
        body.questions.map((question, index) =>
          tx.question.create({
            data: {
              ...question,
              order: index,
              formId: id,
              options: question.type === 'DROPDOWN' ? {
                create: question.options
              } : undefined
            }
          })
        )
      );

      return form;
    });

    return NextResponse.json(updatedForm);
  } catch (error) {
    console.error('Error updating form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = params;
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Verify form ownership
    const existingForm = await prisma.form.findUnique({
      where: { id },
      select: { creatorId: true }
    });

    if (!existingForm || existingForm.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 403 }
      );
    }

    await prisma.form.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}