// app/api/responses/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const body = await request.json();

    // Basic validation
    if (!body.formId || !body.answers?.length) {
      return NextResponse.json(
        { error: 'Invalid response data' },
        { status: 400 }
      );
    }

    // Check form existence and status
    const form = await prisma.form.findUnique({
      where: { id: body.formId },
      include: { questions: true },
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    if (!form.published) {
      return NextResponse.json(
        { error: 'Form is not published' },
        { status: 403 }
      );
    }

    // Check required questions
    const requiredQuestions = form.questions
      .filter((q) => q.required)
      .map((q) => q.id);

    const answeredQuestions = body.answers.map((a) => a.questionId);
    const missingRequired = requiredQuestions.filter(
      (id) => !answeredQuestions.includes(id)
    );

    if (missingRequired.length > 0) {
      return NextResponse.json(
        { error: 'Missing required questions' },
        { status: 400 }
      );
    }

    // Create response with answers in transaction
    const session = await getServerSession(authOptions);

    const response = await prisma.$transaction(async (tx) => {
      const newResponse = await tx.response.create({
        data: {
          formId: body.formId,
          userId: session?.user?.id,
        },
      });

      await Promise.all(
        body.answers.map((answer) =>
          tx.answer.create({
            data: {
              value: answer.value,
              questionId: answer.questionId,
              responseId: newResponse.id,
            },
          })
        )
      );

      return newResponse;
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error submitting response:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
