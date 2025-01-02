import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function saveFile(file, directory) {
  // 确保目录存在
  await mkdir(directory, { recursive: true });

  // 生成唯一文件名
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const filename = uniqueSuffix + path.extname(file.originalFilename);
  const filepath = path.join(directory, filename);

  // 写入文件
  await writeFile(filepath, Buffer.from(await file.arrayBuffer()));
  
  return filename;
} 