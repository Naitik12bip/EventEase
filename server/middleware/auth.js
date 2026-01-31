import { clerkClient } from "@clerk/express";

export const protectAdmin = async (req, res, next) => {
  try {
    console.log("AUTH:", req.auth());

    const { userId } = req.auth();
    if (!userId) {
      return res.status(401).json({ success: false, message: "No session found. Please log in." });
    }

    const user = await clerkClient.users.getUser(userId);
    console.log("PRIVATE METADATA:", user.privateMetadata);

    if (user.privateMetadata?.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Access denied: Admins only." });
    }

    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};
