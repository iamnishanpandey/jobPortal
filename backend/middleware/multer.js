import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, "../uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadsDir);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    const baseName = path
      .basename(file.originalname || "upload", extension)
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .slice(0, 40);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    callback(null, `${baseName || "file"}-${unique}${extension}`);
  },
});

const uploader = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

export const singleupload = uploader.single("file");
export const profileUpload = uploader.fields([
  { name: "profilePhoto", maxCount: 1 },
  { name: "resume", maxCount: 1 },
]);
