import CryptoJS from "crypto-js";

const SECRET_KEY = process.env.NEXT_PUBLIC_SECRET_KEY; // must be 16 chars for AES-128
const keyBytes = CryptoJS.enc.Utf8.parse(SECRET_KEY);

const options = {
    iv: keyBytes,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
};

export function decryptOtp(cipherTextBase64) {
    const decrypted = CryptoJS.AES.decrypt(cipherTextBase64, keyBytes, options);
    return decrypted.toString(CryptoJS.enc.Utf8);
}

export function encryptOtp(plainOtp) {
    const encrypted = CryptoJS.AES.encrypt(plainOtp, keyBytes, options);
    return encrypted.toString();
}