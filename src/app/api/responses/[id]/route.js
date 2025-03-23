// app/api/responses/[id]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = params;
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const response = await prisma.response.findUnique({
      where: { id },
      include: {
        answers: {
          include: { question: true }
        },
        form: {
          select: { creatorId: true }
        }
      }
    });

    if (!response) {
      return NextResponse.json(
        { error: 'Response not found' }, 
        { status: 404 }
      );
    }

    if (response.form.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 403 }
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching response:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}