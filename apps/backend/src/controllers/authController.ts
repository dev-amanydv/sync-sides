import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma  from "hello-prisma";

const JWT_SECRET = process.env.JWT_SECRET || "yoursecretkey";

export const signup = async (req: Request, res: Response): Promise<void> => {
  const { password, email, fullname } = req.body;
console.log("Fullname: ", fullname, "Email: ", email, "Password: ", password)
  if ( !password || !email || !fullname) {
    res.status(400).json({ error: "* fields are required" })
    return ;
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        res.status(400).json({ error: "email already exists" })
      return ;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        password: hashedPassword,
        email: email,
        fullname: fullname
      },
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  console.log("request hitted:")
  const { email, password } = req.body;
console.log("email: ",email)
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" })
    return ;
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        res.status(401).json({ error: "Invalid credentials" })
      return ;
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.log("error in auth: ", err)
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  console.log("request hitted for updation:")
  const { email, fullname, userId } = req.body;
  try {

    const updateUser = await prisma.user.update({
      where:{
        id: userId
      },
      data:{
        fullname: fullname,
        email: email
      }
    })


    res.status(200).json({updateUser });
  } catch (err) {
    console.log("error in updation: ", err)
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const stats = async (req: Request, res: Response): Promise<void> => {
  console.log("request hitted for stats:")
  const { userId } = req.body;
  try {

    const user = await prisma.user.findUnique({
      where:{
        id: userId
      },
      include: {
        meetingsHosted: true,
        participants: true
      }
    })
    res.status(200).json({user });
  } catch (err) {
    console.log("error in stats: ", err)
    res.status(500).json({ error: "Internal Server Error" });
  }
};
