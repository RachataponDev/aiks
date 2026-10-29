import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.resolve(process.cwd(), 'data/uploads');

export async function POST() {
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      return NextResponse.json({ success: true, message: 'Uploads directory created and empty.' });
    }

    // Read all files in uploads directory
    const files = fs.readdirSync(UPLOADS_DIR);
    for (const file of files) {
      const filePath = path.join(UPLOADS_DIR, file);
      try {
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.warn(`Failed to delete ${file}:`, err);
      }
    }

    // Re-initialize empty registry and empty ledger
    fs.writeFileSync(path.join(UPLOADS_DIR, 'file_registry.json'), JSON.stringify({}, null, 2), 'utf-8');
    fs.writeFileSync(path.join(UPLOADS_DIR, 'active_promotions_ledger.json'), JSON.stringify([], null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'All system files, cached datasets, and promotions have been completely reset.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

