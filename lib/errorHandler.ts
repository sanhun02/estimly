import { showToast } from "./toast";

interface ErrorContext {
    operation: string;
    fallbackMessage?: string;
}

export function handleError(error: any, context: ErrorContext) {
    console.error(`Error during ${context.operation}:`, error);

    // get user-friendly message
    const userMessage = getUserFriendlyMessage(error, context);

    showToast.error(getErrorTitle(context.operation), userMessage);
}

function getUserFriendlyMessage(error: any, context: ErrorContext): string {
    if (error?.code) {
        switch (error.code) {
            case "PGRST116":
                return "No data found. Please try again.";
            case "23505":
                return "This item already exists.";
            case "23503":
                return "Cannot delete - this item is being used elsewhere.";
            case "42501":
                return "Permission denied. Please check your account settings.";
            case "23502":
                return "Missing required information. Please fill in all fields.";
            case "auth/invalid-email":
                return "Please enter a valid email address.";
            case "auth/user-not-found":
                return "No account found with this email.";
            case "auth/wrong-password":
                return "Incorrect password. Please try again.";
            case "auth/email-already-in-use":
                return "An account with this email already exists.";
            case "auth/weak-password":
                return "Password should be at least 6 characters.";
            case "auth/too-many-requests":
                return "Too many attempts. Please try again later.";
            case "auth/network-request-failed":
                return "Network error. Please check your connection.";
            default:
                break;
        }
    }

    const errorMessage = error?.message?.toLowerCase() || "";

    if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
        return "Unable to connect. Please check your internet connection.";
    }

    if (errorMessage.includes("timeout")) {
        return "Request timed out. Please try again.";
    }

    if (errorMessage.includes("invalid") && errorMessage.includes("token")) {
        return "Your session has expired. Please log in again.";
    }

    if (errorMessage.includes("violates row-level security")) {
        return "You don't have permission to perform this action.";
    }

    if (errorMessage.includes("unique constraint")) {
        return "This item already exists in your account.";
    }

    if (errorMessage.includes("not found")) {
        return "Item not found. It may have been deleted.";
    }

    // Use fallback message or generic message
    return context.fallbackMessage || "Something went wrong. Please try again.";
}

function getErrorTitle(operation: string): string {
    const operationTitles: Record<string, string> = {
        signup: "Signup Failed",
        login: "Login Failed",
        logout: "Logout Failed",
        "load dashboard": "Dashboard Error",
        "load clients": "Load Failed",
        "create client": "Create Failed",
        "update client": "Update Failed",
        "delete client": "Delete Failed",
        "load estimates": "Load Failed",
        "create estimate": "Create Failed",
        "update estimate": "Update Failed",
        "delete estimate": "Delete Failed",
        "send estimate": "Send Failed",
        "company setup": "Setup Failed",
        "verify email": "Verification Failed",
    };

    return operationTitles[operation.toLowerCase()] || "Error";
}

export function validateEmail(email: string): string | null {
    if (!email.trim()) {
        return "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return "Please enter a valid email address";
    }
    return null;
}

export function validatePhone(phone: string): string | null {
    if (!phone.trim()) return null; // Phone is optional

    // Remove common formatting characters
    const cleaned = phone.replace(/[\s\-\(\)\.]/g, "");

    // Check if it's a valid length (10-15 digits)
    if (cleaned.length < 10 || cleaned.length > 15) {
        return "Please enter a valid phone number";
    }

    return null;
}

export function validateRequired(
    value: string,
    fieldName: string
): string | null {
    if (!value?.trim()) {
        return `${fieldName} is required`;
    }
    return null;
}
