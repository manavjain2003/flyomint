// "use client";

// import { useState, useRef, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import Link from "next/link";
// import Image from "next/image";
// import { FaFacebookF } from "react-icons/fa";
// import { FcGoogle } from "react-icons/fc";
// import { AiOutlineLoading3Quarters } from "react-icons/ai";
// import { requestLoginOtp, verifyLoginOtp } from "@/app/lib/authApi";

// export default function SignUpPage() {
//     const router = useRouter();

//     const [step, setStep] = useState("signup"); // "signup" | "otp"
//     const [name, setName] = useState("");
//     const [email, setEmail] = useState("");
//     const [password, setPassword] = useState("");
//     const [mobile, setMobile] = useState("");
//     const [userKey, setUserKey] = useState("");
//     const [otp, setOtp] = useState(["", "", "", "", "", ""]);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState("");
//     const [info, setInfo] = useState("");

//     const otpRefs = useRef([]);

//     useEffect(() => {
//         if (step === "otp") otpRefs.current[0]?.focus();
//     }, [step]);

//     const handleContinue = async (e) => {
//         e.preventDefault();
//         setError("");
//         setInfo("");

//         if (!name.trim()) {
//             setError("Enter your full name");
//             return;
//         }

//         if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
//             setError("Enter a valid email address");
//             return;
//         }

//         if (!/^[6-9]\d{9}$/.test(mobile)) {
//             setError("Enter a valid 10-digit mobile number");
//             return;
//         }

//         if (!password || password.length < 6) {
//             setError("Password must be at least 6 characters");
//             return;
//         }

//         setLoading(true);
//         const result = await requestLoginOtp(mobile);
//         setLoading(false);

//         if (result.success) {
//             setUserKey(result.userKey);
//             setStep("otp");
//             setInfo(result.message);
//         } else {
//             setError(result.message);
//         }
//     };

//     const handleOtpChange = (index, value) => {
//         if (!/^[0-9]?$/.test(value)) return;
//         const next = [...otp];
//         next[index] = value;
//         setOtp(next);
//         if (value && index < 5) otpRefs.current[index + 1]?.focus();
//         if (next.every((d) => d !== "")) submitOtp(next.join(""));
//     };

//     const handleOtpKeyDown = (index, e) => {
//         if (e.key === "Backspace" && !otp[index] && index > 0) {
//             otpRefs.current[index - 1]?.focus();
//         }
//     };

//     const submitOtp = async (code) => {
//         setError("");
//         setLoading(true);

//         const result = await verifyLoginOtp({ mobile, userKey, otp: code });
//         setLoading(false);

//         if (result.success) {
//             sessionStorage.setItem("uniqueKey", result.uniqueKey);
//             setInfo("Verification successful! Redirecting...");
//             setTimeout(() => {
//                 router.push("/");
//                 router.refresh();
//             }, 500);
//         } else {
//             setError(result.message);
//             setOtp(["", "", "", "", "", ""]);
//             otpRefs.current[0]?.focus();
//         }
//     };

//     const handleResend = async () => {
//         setError("");
//         setInfo("");
//         setLoading(true);

//         const result = await requestLoginOtp(mobile);
//         setLoading(false);

//         if (result.success) {
//             setUserKey(result.userKey);
//             setInfo(result.message);
//         } else {
//             setError(result.message);
//         }
//     };

//     const handleBack = () => {
//         setStep("signup");
//         setOtp(["", "", "", "", "", ""]);
//         setError("");
//         setInfo("");
//     };

//     return (
//         <div className="min-h-screen flex bg-white">
//             {/* Left side — illustration panel */}
//             <div className="hidden lg:flex lg:w-1/2 items-center justify-center px-10 py-10">
//                 <div className="w-full max-w-md h-[calc(100vh-12rem)] bg-[#FF7626] rounded-[2.5rem] flex flex-col justify-between p-10">
//                     <div className="flex-1 flex items-center justify-center">
//                         <Image
//                             src={step === "otp" ? "/assets/otp-verification.png" : "/assets/login_illustration.png"}
//                             alt={step === "otp" ? "OTP verification" : "Login illustration"}
//                             width={420}
//                             height={420}
//                             className="w-full h-auto max-w-xs object-contain"
//                         />
//                     </div>
//                     <p className="text-white font-semibold text-lg leading-snug">
//                         {step === "otp"
//                             ? "Enter the verification code sent to your mobile"
//                             : "Book your flights with ease and convenience!"}
//                     </p>
//                 </div>
//             </div>

//             {/* Right side — form */}
//             <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
//                 <div className="w-full max-w-sm">
//                     <div className="flex items-center gap-2 mb-10">
//                         <Image src="/assets/logo.jpg" alt="Flyomint" width={140} height={35} className="h-8 w-auto" />
//                     </div>

//                     {step === "signup" ? (
//                         <>
//                             <h1 className="text-4xl font-bold text-gray-900 mb-2">Create Account</h1>
//                             <p className="text-gray-500 text-sm mb-8">Sign up to start booking flights</p>

//                             <form onSubmit={handleContinue} className="space-y-4">
//                                 <input
//                                     type="text"
//                                     value={name}
//                                     onChange={(e) => setName(e.target.value)}
//                                     placeholder="Full Name"
//                                     required
//                                     disabled={loading}
//                                     className="w-full h-[52px] px-5 rounded-full border border-gray-200 text-[15px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#FF7626] transition-colors disabled:opacity-60"
//                                 />
//                                 <input
//                                     type="email"
//                                     value={email}
//                                     onChange={(e) => setEmail(e.target.value)}
//                                     placeholder="Email ID"
//                                     required
//                                     disabled={loading}
//                                     className="w-full h-[52px] px-5 rounded-full border border-gray-200 text-[15px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#FF7626] transition-colors disabled:opacity-60"
//                                 />
//                                 <input
//                                     type="tel"
//                                     inputMode="numeric"
//                                     value={mobile}
//                                     onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
//                                     placeholder="Mobile Number"
//                                     maxLength={10}
//                                     required
//                                     disabled={loading}
//                                     className="w-full h-[52px] px-5 rounded-full border border-gray-200 text-[15px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#FF7626] transition-colors disabled:opacity-60"
//                                 />
//                                 <input
//                                     type="password"
//                                     value={password}
//                                     onChange={(e) => setPassword(e.target.value)}
//                                     placeholder="Password"
//                                     required
//                                     disabled={loading}
//                                     className="w-full h-[52px] px-5 rounded-full border border-gray-200 text-[15px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#FF7626] transition-colors disabled:opacity-60"
//                                 />
//                                 {error && (
//                                     <p className="text-red-500 text-sm bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>
//                                 )}
//                                 {info && (
//                                     <p className="text-green-600 text-sm bg-green-50 px-4 py-2.5 rounded-xl">{info}</p>
//                                 )}

//                                 <button
//                                     type="submit"
//                                     disabled={loading}
//                                     className="w-full h-[52px] rounded-full bg-[#FF7626] hover:bg-[#e6661f] text-white font-semibold text-[15px] flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
//                                 >
//                                     {loading ? <AiOutlineLoading3Quarters className="w-4 h-4 animate-spin" /> : "Continue"}
//                                 </button>
//                             </form>

//                             <div className="relative my-7">
//                                 <div className="absolute inset-0 flex items-center">
//                                     <div className="w-full border-t border-gray-200" />
//                                 </div>
//                                 <div className="relative flex justify-center">
//                                     <span className="px-3 bg-white text-xs text-gray-400">Or continue with</span>
//                                 </div>
//                             </div>

//                             <div className="grid grid-cols-2 gap-3">
//                                 <button
//                                     type="button"
//                                     className="flex items-center justify-center gap-2 h-12 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
//                                 >
//                                     <FcGoogle className="w-5 h-5" />
//                                     Google
//                                 </button>
//                                 <button
//                                     type="button"
//                                     className="flex items-center justify-center gap-2 h-12 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
//                                 >
//                                     <FaFacebookF className="w-4 h-4 text-[#1877F2]" />
//                                     Facebook
//                                 </button>
//                             </div>

//                             <p className="mt-8 text-center text-sm text-gray-600">
//                                 Already have an account?{" "}
//                                 <Link href="/login" className="text-[#FF7626] font-semibold hover:underline">
//                                     Sign In
//                                 </Link>
//                             </p>
//                         </>
//                     ) : (
//                         <>
//                             <button
//                                 onClick={handleBack}
//                                 disabled={loading}
//                                 className="mb-6 text-sm text-gray-500 hover:text-gray-800 disabled:opacity-50"
//                             >
//                                 ← Back to Sign Up
//                             </button>

//                             <h1 className="text-4xl font-bold text-gray-900 mb-2">Enter OTP</h1>
//                             <p className="text-gray-500 text-sm mb-8">
//                                 We sent a verification code to <span className="font-semibold">{mobile}</span>
//                             </p>

//                             <div className="flex gap-2 mb-6">
//                                 {otp.map((digit, i) => (
//                                     <input
//                                         key={i}
//                                         ref={(el) => (otpRefs.current[i] = el)}
//                                         value={digit}
//                                         onChange={(e) => handleOtpChange(i, e.target.value)}
//                                         onKeyDown={(e) => handleOtpKeyDown(i, e)}
//                                         inputMode="numeric"
//                                         maxLength={1}
//                                         disabled={loading}
//                                         className="w-12 h-14 text-center text-lg font-semibold rounded-xl border border-gray-200 outline-none focus:border-[#FF7626] transition-colors disabled:opacity-60"
//                                     />
//                                 ))}
//                             </div>

//                             {error && (
//                                 <p className="text-red-500 text-sm text-center bg-red-50 px-4 py-2.5 rounded-xl mb-4">
//                                     {error}
//                                 </p>
//                             )}
//                             {info && (
//                                 <p className="text-green-600 text-sm text-center bg-green-50 px-4 py-2.5 rounded-xl mb-4">
//                                     {info}
//                                 </p>
//                             )}

//                             <div className="text-center">
//                                 <p className="text-xs text-gray-500 mb-2">Didn&apos;t receive the code?</p>
//                                 <button
//                                     type="button"
//                                     onClick={handleResend}
//                                     disabled={loading}
//                                     className="text-[#FF7626] font-semibold text-sm hover:underline disabled:opacity-50"
//                                 >
//                                     {loading ? "Sending..." : "Resend OTP"}
//                                 </button>
//                             </div>
//                         </>
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// }