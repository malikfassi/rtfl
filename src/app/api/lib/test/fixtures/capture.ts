import { writeFile, mkdir } from 'fs/promises';
import { join, dirname, extname } from 'path';

interface CaptureOptions {
  service: string;
  name: string;
  response: unknown;
}

export async function captureResponse({ service, name, response }: CaptureOptions) {
  // Split name into directory parts and filename
  const parts = name.split('/');
  const fileName = parts.pop()!;
  
  // Create the full directory path
  const dirPath = join(process.cwd(), 'src/app/api/lib/test/fixtures/data', service, ...parts);
  
  // Create all necessary directories
  await mkdir(dirPath, { recursive: true });
  
  // Determine file extension and write content
  const ext = extname(fileName);
  const filePath = join(dirPath, fileName + (ext ? '' : '.json'));
  
  if (ext === '.html') {
    await writeFile(filePath, response as string);
  } else {
    await writeFile(filePath, JSON.stringify(response, null, 2));
  }
} 