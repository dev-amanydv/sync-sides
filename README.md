# SyncSides – High-Quality Meeting Recordings 🎥🚀

**SyncSides** is a sleek and powerful meeting recording platform built for podcasters, interviewers, and content creators. It offers an intuitive interface and powerful features to help you create high-quality, professional-grade video content effortlessly. 

> ⚠️ **Important Note:**  
> The recording feature does **not** work in production due to high memory usage, which exceeds the limits of our free-tier Render server.  
>  
> To try it out, you can **run the project locally** on your machine where the recording works perfectly.

## 📸 Screenshots
| LandingPage | AuthPage |
|------|----------|
|<img width="1440" height="811" alt="Image" src="https://github.com/user-attachments/assets/37a782c3-fc86-4e1d-8070-e766965eb839" /> |<img width="1440" height="811" alt="Image" src="https://github.com/user-attachments/assets/5c508d96-f6d0-410d-b8d3-b4499c106c65" />

| Dashboard | Meeting Room |
|------|----------|
|<img width="1440" height="810" alt="Image" src="https://github.com/user-attachments/assets/c740b38b-d98b-4c9b-a6f5-bb29f9977894" /> |<img width="1439" height="809" alt="Image" src="https://github.com/user-attachments/assets/d7518f8a-b0f3-460f-b010-fe4382c9e274" />

## How it actually works?

<img width="4929" height="2470" alt="Image" src="https://github.com/user-attachments/assets/bd32f338-5323-42d6-93d0-f4b6cff33660" />


## 🌟 Features  

-  **Local Video Recording** – Captures each participant's video locally to ensure high-resolution output, regardless of internet stability.
-  **Real-Time HD Meetings** – Facilitates direct peer-to-peer video calls using WebRTC for a seamless experience.
-  **Side-by-Side Merging** – Combines individual recordings into a single, side-by-side video, perfect for interviews and discussions.  
-  **Smart Participation Tracking** – Displays real-time participants and tracks meeting duration based on the host's presence.  
-  **User Authentication** – Secure login system for host and participants.  
-  **Analytics Integration** – Track visitor engagement and performance.  
-  **Fast & Scalable** – Optimized for performance with a robust backend to handle real-time data and video processing.

## 🌍 Live Demo
 Checkout here: https://sync-sides-docs.vercel.app/
## 🛠 Tech Stack  

- **Frontend:** Next.js, TypeScript, Express, WebRTC, Tailwind CSS, Socket.IO
- **Backend:** Node.js, Express.js, TypeScript, PostgreSQL, Prisma
- **Authentication:** JWT, NextAuth  
- **Deployment:** Vercel, Render

## 🚀 Getting Started  

Step-1: Clone the Repository and install dependencies.
```sh
git clone https://github.com/dev-amanydv/sync-side.git
cd sync-side/apps
npm install
```

Step-2: Get yourself a postgresQl DATABASE_URL. For Sign In with Google method, you'll need GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET from https://console.cloud.google.com/

Step-3: Create .env file in the root folder of both apps (sync-side & backend) and copy all variables of .env.example to .env. Replace necessary details with your credentials.

Step-4: Navigate to backend folder and generate Prisma Client.
```sh
cd backend
npx prisma generate
npx tsc -b
npm run dev
```

Step-4: Navigate to frontend folder and start server in another terminal.
```sh
cd apps/sync-side
npm run dev
```

Step-5: Open http://localhost:3000 in your browser.

You're all set to use it locally.
