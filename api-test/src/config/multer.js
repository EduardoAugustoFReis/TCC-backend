import multer from "multer";
import path from "path";
import fs from "fs";

const uploadsFolder = path.resolve("uploads");

// garante pasta existe
if (!fs.existsSync(uploadsFolder)) {
  fs.mkdirSync(uploadsFolder, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsFolder),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLocaleLowerCase();
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, filename);
  },
});

// aceita apenas imagens e limita tamanho (ex.: 2MB)
const fileFilter = (req, file, cb) => {
  if (/^image\/(jpeg|png|webp)$/.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Apenas arquivos de imagem (jpeg, png, webp) são permitidos"));
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter,
})