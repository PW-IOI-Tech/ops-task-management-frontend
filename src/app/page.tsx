'use client';

import Link from "next/link";

export default function Home() {
  return (
   <Link href="/auth/login">
     <button>Login</button>
   </Link>
  );
}
