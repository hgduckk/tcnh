import { NextResponse, NextRequest } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';
import { assertAdminRequest } from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
  const authError = assertAdminRequest(req);
  if (authError) return authError;

  try {
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(req.nextUrl.searchParams.get('pageSize') || '50'), 100); // Max 100 per page
    
    // Fetch data with generous limit to get total count
    const rows = await getSheetData(5000);

    const parsed = [];
    if (Array.isArray(rows) && rows.length > 0) {
      const [header, ...dataRows] = rows;
      for (const row of dataRows) {
        const item: any = {};
        header.forEach((col: string, idx: number) => {
          item[col] = row[idx] || '';
        });
        parsed.push(item);
      }
    }

    // Apply pagination
    const startIdx = (page - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const paginatedData = parsed.slice(startIdx, endIdx);

    return NextResponse.json({ 
      success: true, 
      data: paginatedData,
      total: parsed.length,
      page,
      pageSize,
      totalPages: Math.ceil(parsed.length / pageSize)
    });
  } catch (error) {
    console.error('Failed to read form submissions:', error);
    return NextResponse.json({ 
      success: false, 
      message: String(error), 
      data: [],
      total: 0,
      page: 1,
      pageSize: 50,
      totalPages: 0
    }, { status: 500 });
  }
}
