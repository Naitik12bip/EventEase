import { Inngest } from "inngest";
import User from "../models/User.js";

export const inngest = new Inngest({ id: "event-ticket-booking" });

// 1. Sync User Creation
const syncUserCreation = inngest.createFunction(
    { id: 'sync-user-from-clerk' },
    { event: 'clerk/user.created' },
    async ({ event }) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data;
        
        const userData = {
            _id: id,
            // FIX: email_addresses is an array of objects. 
            // The property inside is usually 'email_address', not 'email_addresses'
            email: email_addresses[0]?.email_address, 
            name: `${first_name} ${last_name}`,
            image: image_url
        };

        await User.create(userData);
    }
);

// 2. Sync User Deletion
const syncUserDeletion = inngest.createFunction(
    { id: 'delete-user-with-clerk' },
    { event: 'clerk/user.deleted' },
    async ({ event }) => {
        const { id } = event.data;
        // Optimization: Inngest handles retries automatically if this fails
        await User.findByIdAndDelete(id);
    }
);

// 3. Sync User Update
const syncUserUpdation = inngest.createFunction(
    { id: 'update-user-from-clerk' },
    { event: 'clerk/user.updated' },
    async ({ event }) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data;

        const userData = {
            email: email_addresses[0]?.email_address,
            name: `${first_name} ${last_name}`,
            image: image_url
        };

        // Use findByIdAndUpdate with the 'id' directly
        await User.findByIdAndUpdate(id, userData);
    }
);

export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation
];