import fs from "node:fs";
import path from "node:path";
import { env } from "./env.js";

export function ensureUploadDir(): string {
  const dir = env.UPLOAD_DIR;
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function uploadPathFor(filename: string): string {
  return path.join(env.UPLOAD_DIR, filename);
}

export function readFileBase64(filepath: string): string {
  return fs.readFileSync(filepath, { encoding: "base64" });
}

export function fileExists(filepath: string): boolean {
  try {
    return fs.statSync(filepath).isFile();
  } catch {
    return false;
  }
}
