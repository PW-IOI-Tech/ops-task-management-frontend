"use client"; // 👈 add this

import LoginComponent from "./Login";

const LoginPage = () => {
  const handleGoogleSignIn = () => {
    console.log("Custom Google sign-in logic");
  };

  return <LoginComponent onGoogleSignIn={handleGoogleSignIn} />;
};

export default LoginPage;
