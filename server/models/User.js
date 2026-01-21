import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    image: { type: String }
});

// Short-circuit evaluation prevents re-compilation errors in development
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;