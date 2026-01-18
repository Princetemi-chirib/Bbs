import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7);
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user || user.role !== 'ADMIN' || !user.isActive) return null;
    return user;
  } catch {
    return null;
  }
}

// GET /api/v1/products - Get all products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const activeParam = searchParams.get('active'); // "true" | "false" | "all" | null

    const where: any = {};
    if (activeParam !== 'all') {
      // default: only active
      where.isActive = activeParam === 'false' ? false : true;
    }

    if (category && (category === 'general' || category === 'recovery')) {
      where.category = category.toUpperCase();
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    // Transform to match frontend format
    const formattedProducts = products.map(product => ({
      id: product.id,
      title: product.title,
      description: product.description || '',
      adultPrice: Number(product.adultPrice),
      kidsPrice: product.kidsPrice ? Number(product.kidsPrice) : null,
      category: product.category.toLowerCase() as 'general' | 'recovery',
      beforeImage: product.beforeImage,
      afterImage: product.afterImage,
      isActive: product.isActive,
      displayOrder: product.displayOrder,
    }));

    return NextResponse.json({
      success: true,
      data: formattedProducts,
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to fetch products',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/v1/products - Create a new product (Admin only)
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized. Admin access required.' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      adultPrice,
      kidsPrice,
      category,
      beforeImage,
      afterImage,
      isActive = true,
      displayOrder = 0,
    } = body;

    // Validate required fields
    if (!title || !adultPrice || !category || !beforeImage || !afterImage) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Missing required fields: title, adultPrice, category, beforeImage, afterImage',
          },
        },
        { status: 400 }
      );
    }

    if (category !== 'general' && category !== 'recovery') {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Category must be "general" or "recovery"',
          },
        },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        title,
        description: description || null,
        adultPrice,
        kidsPrice: kidsPrice || null,
        category: category.toUpperCase(),
        beforeImage,
        afterImage,
        isActive,
        displayOrder,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: product.id,
        title: product.title,
        description: product.description,
        adultPrice: Number(product.adultPrice),
        kidsPrice: product.kidsPrice ? Number(product.kidsPrice) : null,
        category: product.category.toLowerCase(),
        beforeImage: product.beforeImage,
        afterImage: product.afterImage,
        isActive: product.isActive,
        displayOrder: product.displayOrder,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to create product',
        },
      },
      { status: 500 }
    );
  }
}
