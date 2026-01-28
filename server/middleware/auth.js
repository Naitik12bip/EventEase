import { clerkClient } from "@clerk/express";

export const protectAdmin = async (req, res, next) => {
    try {
        // FIX 1: Use req.auth() as a function (Clerk v5+ requirement)
        const { userId } = req.auth(); 

        if (!userId) {
            return res.status(401).json({ success: false, message: "No session found. Please log in." });
        }

        // FIX 2: Await the user data from Clerk
        const user = await clerkClient.users.getUser(userId);

        // FIX 3: Check metadata for admin role
        if (user.privateMetadata?.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Access denied: Admins only." });
        }

        next(); // Success! Move to addShow controller
    } catch (err) {
        console.error("Auth Middleware Error:", err);
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
}