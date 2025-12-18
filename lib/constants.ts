export const APP_CONFIG = {
    PAGINATION: {
        DEFAULT_LIMIT: Number(process.env.NEXT_PUBLIC_DEFAULT_LIMIT) || 20,
        DEBOUNCE_DELAY: 300,
    },
    UPLOAD: {
        MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
        ACCEPTED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    },
    TOAST: {
        DURATION: 3000,
    }
};
