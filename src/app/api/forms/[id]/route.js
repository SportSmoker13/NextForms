import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = params;

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Verify form ownership
    const existingForm = await prisma.form.findUnique({
      where: { id },
      select: { creatorId: true },
    });

    if (!existingForm || existingForm.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update form and questions in transaction
    const updatedForm = await prisma.$transaction(async (tx) => {
      // Update form details
      const form = await tx.form.update({
        where: { id },
        data: {
          title: body.title,
          description: body.description,
        },
      });

      // Delete existing questions and options
      await tx.option.deleteMany({
        where: { question: { formId: id } },
      });
      await tx.question.deleteMany({
        where: { formId: id },
      });

      // Create new questions
      await Promise.all(
        body.questions.map(async (question, index) => {
          // Create question with validation-specific fields
          const createdQuestion = await tx.question.create({
            data: {
              label: question.label,
              placeholder: question.placeholder,
              required: question.required,
              type: question.type,
              order: index,
              formId: id,

              // Validation-specific fields
              scale: question.type === 'RATING' ? question.scale : null,
              minLength: question.minLength,
              maxLength: question.maxLength,
              min: question.min,
              max: question.max,
              pattern: question.pattern,
            },
          });

          // Handle options for multi-choice questions
          if (
            ['DROPDOWN', 'CHECKBOX', 'RADIO'].includes(question.type) &&
            question.options
          ) {
            await tx.option.createMany({
              data: question.options.map((option) => ({
                questionId: createdQuestion.id,
                label: option.label,
                value: option.value,
              })),
            });
          }

          return createdQuestion;
        })
      );

      return form;
    });

    return NextResponse.json(updatedForm);
  } catch (error) {
    console.error('Error updating form:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// POST route for creating a new form
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Create form and questions in transaction
    const newForm = await prisma.$transaction(async (tx) => {
      // Create form
      const form = await tx.form.create({
        data: {
          title: body.title,
          description: body.description,
          creatorId: session.user.id,
        },
      });

      // Create questions
      await Promise.all(
        body.questions.map(async (question, index) => {
          const createdQuestion = await tx.question.create({
            data: {
              label: question.label,
              placeholder: question.placeholder,
              required: question.required,
              type: question.type,
              order: index,
              formId: form.id,

              // Validation-specific fields
              scale: question.type === 'RATING' ? question.scale : null,
              minLength: question.minLength,
              maxLength: question.maxLength,
              min: question.min,
              max: question.max,
              pattern: question.pattern,
            },
          });

          // Handle options for multi-choice questions
          if (
            ['DROPDOWN', 'CHECKBOX', 'RADIO'].includes(question.type) &&
            question.options
          ) {
            await tx.option.createMany({
              data: question.options.map((option) => ({
                questionId: createdQuestion.id,
                label: option.label,
                value: option.value,
              })),
            });
          }

          return createdQuestion;
        })
      );

      return form;
    });

    return NextResponse.json(newForm);
  } catch (error) {
    console.error('Error creating form:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// GET route to fetch a specific form
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const form = await prisma.form.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            options: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
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

export async function DELETE(request, data) {
  const params = await data.params;
  try {
    const session = await getServerSession(authOptions);
    const { id } = params;

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify form ownership
    const existingForm = await prisma.form.findUnique({
      where: { id },
      select: { creatorId: true },
    });

    if (!existingForm || existingForm.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.form.delete({
      where: { id },
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
