// import { createClient } from "@supabase/supabase-js";

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// const supabase = createClient(supabaseUrl, supabaseAnonKey);

// /**
//  * Uploads a file (Blob or File) to Supabase Storage and returns the public URL.
//  * @param bucket - your bucket name in Supabase (e.g., 'recordings')
//  * @param path - full path inside the bucket (e.g., 'user123/meeting1.webm')
//  * @param file - the Blob or File to upload
//  */
// export async function uploadToSupabase(bucket: string, path: string, file: File | Blob): Promise<string> {
//   const { data, error } = await supabase
//     .storage
//     .from(bucket)
//     .upload(path, file, {
//       cacheControl: "3600",
//       upsert: false,
//       contentType: file.type,
//     });

//   if (error) throw new Error("Upload failed: " + error.message);

//   const { data: { publicUrl } } = supabase
//     .storage
//     .from(bucket)
//     .getPublicUrl(path);

//   return publicUrl;
// }