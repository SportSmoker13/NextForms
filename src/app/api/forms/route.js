// app/api/forms/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Get pagination parameters from URL query
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '4');

    // Validate pagination parameters
    if (isNaN(page) || page < 1 || isNaN(pageSize) || pageSize < 1) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Calculate skip value
    const skip = (page - 1) * pageSize;

    // Get paginated forms and total count
    const [forms, total] = await Promise.all([
      prisma.form.findMany({
        where: { creatorId: session.user.id },
        include: {
          _count: { select: { responses: true } },
          questions: { select: { id: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.form.count({
        where: { creatorId: session.user.id }
      })
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      data: forms,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
    
  } catch (error) {
    console.error('Error fetching forms:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Basic validation
    if (!body.title || !body.questions?.length) {
      return NextResponse.json(
        { error: 'Invalid form data' },
        { status: 400 }
      );
    }

    // Create form with questions in transaction
    const newForm = await prisma.$transaction(async (tx) => {
      const form = await tx.form.create({
        data: {
          title: body.title,
          description: body.description,
          creatorId: session.user.id
        }
      });

      await Promise.all(
        body.questions.map((question, index) => 
          tx.question.create({
            data: {
              ...question,
              order: index,
              formId: form.id,
              options: question.type === 'DROPDOWN' ? {
                create: question.options
              } : undefined
            }
          })
        )
      );

      return form;
    });

    return NextResponse.json(newForm, { status: 201 });
  } catch (error) {
    console.error('Error creating form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}