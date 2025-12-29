import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET() {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT
        c.CategoryId,
        c.CategoryName,
        sc.SubCategoryId,
        sc.SubCategoryName,
        sc.ParentSubCategoryId
      FROM Category c
      JOIN SubCategory sc ON sc.CategoryId = c.CategoryId
      ORDER BY c.CategoryId, sc.ParentSubCategoryId, sc.SubCategoryId
    `);

    const map = new Map<number, any>();

    // PASS 1: Categories + parent subcategories
    for (const row of result.recordset) {
      if (!map.has(row.CategoryId)) {
        map.set(row.CategoryId, {
          CategoryId: row.CategoryId,
          CategoryName: row.CategoryName,
          SubCategories: [],
        });
      }

      if (row.ParentSubCategoryId === null) {
        map.get(row.CategoryId).SubCategories.push({
          SubCategoryId: row.SubCategoryId,
          SubCategoryName: row.SubCategoryName,
          Children: [],
        });
      }
    }

    // PASS 2: Attach children
    for (const row of result.recordset) {
      if (row.ParentSubCategoryId !== null) {
        const category = map.get(row.CategoryId);
        const parent = category?.SubCategories.find(
          (p: any) => p.SubCategoryId === row.ParentSubCategoryId
        );

        if (parent) {
          parent.Children.push({
            SubCategoryId: row.SubCategoryId,
            SubCategoryName: row.SubCategoryName,
          });
        }
      }
    }

    return NextResponse.json(Array.from(map.values()));
  } catch (err) {
    console.error("Category fetch error:", err);
    return NextResponse.json(
      { error: "Failed to load categories" },
      { status: 500 }
    );
  }
}
