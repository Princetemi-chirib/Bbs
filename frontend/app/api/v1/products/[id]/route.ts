import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/v1/products/:id - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Product not found',
          },
        },
        { status: 404 }
      );
    }

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
    });
  } catch (error: any) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to fetch product',
        },
      },
      { status: 500 }
    );
  }
}

// PUT /api/v1/products/:id - Update product (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      adultPrice,
      kidsPrice,
      category,
      beforeImage,
      afterImage,
      isActive,
      displayOrder,
    } = body;

    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description || null;
    if (adultPrice !== undefined) updateData.adultPrice = adultPrice;
    if (kidsPrice !== undefined) updateData.kidsPrice = kidsPrice || null;
    if (category !== undefined) {
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
      updateData.category = category.toUpperCase();
    }
    if (beforeImage !== undefined) updateData.beforeImage = beforeImage;
    if (afterImage !== undefined) updateData.afterImage = afterImage;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;

    const product = await prisma.product.update({
      where: { id: params.id },
      data: updateData,
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
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Product not found',
          },
        },
        { status: 404 }
      );
    }

    console.error('Error updating product:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to update product',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/products/:id - Delete product (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.product.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Product not found',
          },
        },
        { status: 404 }
      );
    }

    console.error('Error deleting product:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to delete product',
        },
      },
      { status: 500 }
    );
  }
}
