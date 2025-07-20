# SyncSides – High-Quality Meeting Recordings 🎥🚀

**SyncSides** is a sleek and powerful meeting recording platform built for podcasters, interviewers, and content creators. It offers an intuitive interface and powerful features to help you create high-quality, professional-grade video content effortlessly. 

## 🌟 Features  

-  **Local Video Recording** – Captures each participant's video locally to ensure high-resolution output, regardless of internet stability.
-  **Real-Time HD Meetings** – Facilitates direct peer-to-peer video calls using WebRTC for a seamless experience.
-  **Side-by-Side Merging** – Combines individual recordings into a single, side-by-side video, perfect for interviews and discussions.  
-  **Smart Participation Tracking** – Displays real-time participants and tracks meeting duration based on the host's presence.  
-  **User Authentication** – Secure login system for host and participants.  
-  **Analytics Integration** – Track visitor engagement and performance.  
-  **Fast & Scalable** – Optimized for performance with a robust backend to handle real-time data and video processing.

## 🌍 Live Demo
This Project is in development yet.

## 📸 Screenshots
| LandingPage | AuthPage |
|------|----------|
|<img width="1440" alt="Image" src="https://github.com/user-attachments/assets/258cb97e-c028-490d-9f5c-a59aa5a65468" /> |<img width="1440" alt="Image" src="https://github.com/user-attachments/assets/5ed6ba40-7e3e-4dff-93ed-863c15baa65b" /> 

| HomePage | MyArticles |
|------|----------|
|<img width="1440" alt="Image" src="https://github.com/user-attachments/assets/578b62d4-814a-45d0-bfc1-351edc2d2aa2" /> |<img width="1440" alt="Image" src="https://github.com/user-attachments/assets/1c75633f-bfa9-44c9-9a19-90998fb32aec" />



## 🛠 Tech Stack  

- **Frontend:** Next.js, TypeScript, Express, WebRTC, Tailwind CSS, Socket.IO
- **Backend:** Node.js, Express.js, TypeScript, PostgreSQL, Prisma
- **Authentication:** JWT, NextAuth  
- **Deployment:** Vercel, Render

## 🚀 Getting Started  

### 1️⃣ Clone the Repository  
Step-1: Navigate to backend folder and start server.
```sh
git clone https://github.com/dev-amanydv/sync-side.git
cd sync-side
cd backend
npx prisma generate
npx tsc -b
npm run dev
```
Step-2: Get yourself a postgresQl DATABASE_URL.

Step-3: Set DATABASE_URL and JWT_SECRET in .env files of both apps.

Step-4: Navigate to frontend folder and start server in another terminal.
```sh
cd InkWave
cd frontend
npm run dev
```
Step-5: Open http://localhost:3000 in your browser.



