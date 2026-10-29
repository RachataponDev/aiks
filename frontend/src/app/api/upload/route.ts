import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.resolve(process.cwd(), 'data/uploads');
const REGISTRY_FILE = path.resolve(UPLOADS_DIR, 'file_registry.json');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export interface FileMetadata {
  fileId: string;
  category: string;
  originalName: string;
  savedFileName: string;
  filePath: string;
  fileSizeBytes: number;
  uploadedAt: string;
  sampleColumns: string[];
  rowCount: number;
}

function detectCategory(fileName: string, columns: string[]): string {
  const name = fileName.toLowerCase();
  const cols = columns.map(c => c.toLowerCase());

  if (name.includes('recipe') || name.includes('bom') || cols.some(c => c.includes('ingredient_quantity') || c.includes('recipe_id') || (c.includes('ingredient') && c.includes('menu')))) {
    return 'recipes';
  }
  if (name.includes('inventory') || name.includes('stock') || cols.some(c => c.includes('opening_stock') || c.includes('stock_used') || c.includes('waste_quantity') || c.includes('inventory_item'))) {
    return 'inventory';
  }
  if (name.includes('sales') || name.includes('transaction') || name.includes('order') || cols.some(c => c.includes('transaction_id') || c.includes('net_sales') || c.includes('gross_sales'))) {
    return 'sales';
  }
  if (name.includes('feedback') || name.includes('review') || name.includes('rating') || cols.some(c => c.includes('rating') || c.includes('comment') || c.includes('feedback'))) {
    return 'reviews';
  }
  if (name.includes('product') || name.includes('menu') || cols.some(c => c.includes('product_service') || c.includes('menu_item') || c.includes('list_price'))) {
    return 'menu';
  }
  return 'general';
}

export async function GET() {
  try {
    if (fs.existsSync(REGISTRY_FILE)) {
      const data = fs.readFileSync(REGISTRY_FILE, 'utf-8');
      const registry = JSON.parse(data);
      return NextResponse.json({ success: true, registry });
    }
    return NextResponse.json({ success: true, registry: {} });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const singleFile = formData.get('file') as File | null;
    
    const fileList: File[] = [];
    if (files && files.length > 0) {
      fileList.push(...files);
    } else if (singleFile) {
      fileList.push(singleFile);
    }

    if (fileList.length === 0) {
      return NextResponse.json({ success: false, error: 'No files uploaded' }, { status: 400 });
    }

    if (fileList.length > 10) {
      return NextResponse.json({ 
        success: false, 
        error: 'Maximum 10 files allowed per upload.' 
      }, { status: 400 });
    }

    // Read or init registry
    let registry: Record<string, FileMetadata> = {};
    if (fs.existsSync(REGISTRY_FILE)) {
      try {
        registry = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf-8'));
      } catch {
        registry = {};
      }
    }

    const currentCount = Object.keys(registry).length;
    if (currentCount + fileList.length > 10) {
      return NextResponse.json({ 
        success: false, 
        error: `Cannot upload. Total files in system cannot exceed 10 (Current: ${currentCount}).` 
      }, { status: 400 });
    }

    for (const file of fileList) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileContent = buffer.toString('utf-8');
      const lines = fileContent.split(/\r?\n/).filter(line => line.trim().length > 0);
      const sampleColumns = lines.length > 0 ? lines[0].split(',').map(c => c.trim().replace(/^"|"$/g, '')) : [];
      const rowCount = Math.max(0, lines.length - 1);

      // Create unique timestamped filename to prevent naming collisions
      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9._-]/g, '_');
      const uniqueFileName = `${baseName}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.csv`;
      const targetPath = path.join(UPLOADS_DIR, uniqueFileName);

      fs.writeFileSync(targetPath, buffer);

      const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const metadata: FileMetadata = {
        fileId,
        category: 'dataset',
        originalName: file.name,
        savedFileName: uniqueFileName,
        filePath: targetPath,
        fileSizeBytes: buffer.length,
        uploadedAt: new Date().toISOString(),
        sampleColumns,
        rowCount,
      };

      // Store by unique fileId - never overwrite another file!
      registry[fileId] = metadata;
    }

    fs.writeFileSync(REGISTRY_FILE, JSON.stringify(registry, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      allRegistry: registry,
    });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetKey = searchParams.get('key') || searchParams.get('category');
    const targetFileId = searchParams.get('fileId');

    let registry: Record<string, FileMetadata> = {};
    if (fs.existsSync(REGISTRY_FILE)) {
      try {
        registry = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf-8'));
      } catch {
        registry = {};
      }
    }

    const targetId = targetFileId || targetKey;
    if (targetId && registry[targetId]) {
      const filePath = registry[targetId].filePath;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      delete registry[targetId];
      fs.writeFileSync(REGISTRY_FILE, JSON.stringify(registry, null, 2), 'utf-8');
      return NextResponse.json({ success: true, allRegistry: registry });
    }

    if (targetFileId) {
      const foundKey = Object.keys(registry).find(k => registry[k].fileId === targetFileId);
      if (foundKey) {
        const filePath = registry[foundKey].filePath;
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        delete registry[foundKey];
        fs.writeFileSync(REGISTRY_FILE, JSON.stringify(registry, null, 2), 'utf-8');
        return NextResponse.json({ success: true, allRegistry: registry });
      }
    }

    // Otherwise clear all files
    for (const cat of Object.keys(registry)) {
      const filePath = registry[cat].filePath;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    registry = {};
    fs.writeFileSync(REGISTRY_FILE, JSON.stringify(registry, null, 2), 'utf-8');

    return NextResponse.json({ success: true, allRegistry: {} });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
