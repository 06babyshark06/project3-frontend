export const toLocalISOString = (dateString: string | undefined): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    // Convert to local time string in format YYYY-MM-DDTHH:mm for input[type="datetime-local"]
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().slice(0, 16);
};
