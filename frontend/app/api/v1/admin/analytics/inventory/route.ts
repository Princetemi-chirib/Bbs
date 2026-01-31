import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrRep } from '../../utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/admin/analytics/inventory
 * §9 Inventory: stock levels, low stock, out-of-stock, turnover, reorder points.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAdminOrRep(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        category: true,
        stockQuantity: true,
        reorderPoint: true,
        costPrice: true,
        adultPrice: true,
      },
    });

    const productIds = products.map((p) => p.id);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [movements, orderItemsSold] = await Promise.all([
      prisma.inventoryMovement.findMany({
        where: { productId: { in: productIds }, createdAt: { gte: thirtyDaysAgo } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          productId: { in: productIds },
          order: { paymentStatus: 'PAID', createdAt: { gte: thirtyDaysAgo } },
        },
        _sum: { quantity: true },
      }),
    ]);

    const soldMap = new Map<string, number>();
    for (const row of orderItemsSold) {
      soldMap.set(row.productId, Number(row._sum.quantity ?? 0));
    }

    const outMap = new Map<string, number>();
    for (const m of movements) {
      if (m.type === 'OUT' || m.type === 'ADJUSTMENT') {
        const q = m.type === 'OUT' ? -m.quantity : (m.quantity < 0 ? m.quantity : 0);
        outMap.set(m.productId, (outMap.get(m.productId) ?? 0) + Math.abs(q));
      }
    }

    const lowStock: { id: string; title: string; category: string; stockQuantity: number; reorderPoint: number }[] = [];
    const outOfStock: { id: string; title: string; category: string }[] = [];
    const inventoryValue = { total: 0, byProduct: [] as { id: string; title: string; value: number }[] };

    for (const p of products) {
      const stock = p.stockQuantity ?? 0;
      const reorder = p.reorderPoint ?? 0;
      const value = stock * Number(p.costPrice ?? 0);
      inventoryValue.total += value;
      inventoryValue.byProduct.push({ id: p.id, title: p.title, value: Number(value.toFixed(2)) });
      if (reorder > 0 && stock <= reorder && stock > 0) {
        lowStock.push({
          id: p.id,
          title: p.title,
          category: String(p.category),
          stockQuantity: stock,
          reorderPoint: reorder,
        });
      }
      if (stock <= 0 && (p.reorderPoint != null || 1)) {
        outOfStock.push({ id: p.id, title: p.title, category: String(p.category) });
      }
    }

    const turnover = products
      .filter((p) => p.stockQuantity != null && p.stockQuantity > 0)
      .map((p) => {
        const sold = soldMap.get(p.id) ?? 0;
        const avgStock = p.stockQuantity ?? 0;
        const turnoverRate = avgStock > 0 ? Number((sold / avgStock).toFixed(2)) : 0;
        return {
          productId: p.id,
          title: p.title,
          soldLast30Days: sold,
          avgStock: avgStock,
          turnoverRate,
        };
      })
      .sort((a, b) => b.turnoverRate - a.turnoverRate)
      .slice(0, 20);

    return NextResponse.json({
      success: true,
      data: {
        totalProducts: products.length,
        lowStockAlerts: lowStock.length,
        outOfStockCount: outOfStock.length,
        lowStock,
        outOfStock,
        inventoryValue: {
          total: Number(inventoryValue.total.toFixed(2)),
          byProduct: inventoryValue.byProduct.sort((a, b) => b.value - a.value).slice(0, 20),
        },
        turnoverTop20: turnover,
      },
    });
  } catch (e) {
    console.error('Inventory analytics error:', e);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch inventory data' } },
      { status: 500 }
    );
  }
}
