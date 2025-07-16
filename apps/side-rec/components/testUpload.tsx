// "use client";

// import { uploadToSupabase } from "../utils/uploadToSupabase";


// export default function TestUpload() {
//     const handleUpload = async () => {
//         // Simulate a video file (same format you'll actually upload)
//         const dummyBlob = new Blob(["fake video data"], { type: "video/webm" });
//         const path = `test/test-${Date.now()}.webm`;
      
//         try {
//           const publicUrl = await uploadToSupabase("syncsides-recordings", path, dummyBlob);
//           alert("Uploaded! File URL: " + publicUrl);
//         } catch (err: any) {
//           console.error("Upload error:", err);
//           alert("Upload failed: " + err.message);
//         }
//       };

//   return (
//     <div>
//       <button onClick={handleUpload} className="bg-blue-600 text-white px-4 py-2 rounded">
//         Upload Test File to Supabase
//       </button>
//     </div>
//   );
// }