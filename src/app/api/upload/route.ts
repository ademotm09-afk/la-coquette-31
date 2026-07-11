import { v2 as cloudinary } from "cloudinary";
import { isAdmin, unauthorizedResponse } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await isAdmin())) return unauthorizedResponse();
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return Response.json({ error: "Configurez les variables Cloudinary pour activer l’upload." }, { status: 503 });
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  const form = await request.formData();
  const files = form.getAll("files").filter((value): value is File => value instanceof File);
  if (!files.length || files.length > 8) return Response.json({ error: "Ajoutez entre 1 et 8 images." }, { status: 400 });

  const urls = await Promise.all(files.map(async (file) => {
    if (!file.type.startsWith("image/") || file.size > 8_000_000) throw new Error("Image invalide ou supérieure à 8 Mo");
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: "la-coquette/products", resource_type: "image", transformation: [{ quality: "auto", fetch_format: "auto" }] }, (error, uploaded) => {
        if (error || !uploaded) reject(error || new Error("Upload impossible"));
        else resolve(uploaded);
      });
      stream.end(buffer);
    });
    return result.secure_url;
  }));
  return Response.json({ urls });
}
