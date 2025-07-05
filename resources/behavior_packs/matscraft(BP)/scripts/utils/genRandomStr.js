const generateRandomString = (length = 64, charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789") => {
    let result = "";
    const charsetLength = charset.length;
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
        const bytes = new Uint8Array(length);
        crypto.getRandomValues(bytes);
        for (let i = 0; i < length; i++) {
            result += charset.charAt(bytes[i] % charsetLength);
        }
    }
    else {
        for (let i = 0; i < length; i++) {
            result += charset.charAt(Math.floor(Math.random() * charsetLength));
        }
    }
    return result;
};
export default generateRandomString;
