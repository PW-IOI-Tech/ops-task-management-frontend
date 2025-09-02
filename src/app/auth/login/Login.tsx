import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

interface LoginProps {
  onGoogleSignIn?: () => void;
}

const LoginComponent: React.FC<LoginProps> = ({ onGoogleSignIn }) => {
  const {isAuthenticated,user} = useAuth();

  if(isAuthenticated){
    console.log('User is already authenticated:', user);
  }



  const router = useRouter();
  const handleGoogleSignIn = async() => {
   

   window.location.href = `${backendUrl}/api/auth/google`;
  };


  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-4xl w-full h-[600px] flex">
        {/* Left Side - Illustration */}
        <div className="hidden md:flex md:w-1/2 relative" style={{ background: 'linear-gradient(to bottom, #587DBD, #293A57)' }}>
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="w-full h-full relative">
              {/* Top row - Checkmark circle */}
              <div className="absolute top-8 left-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#121A26] opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              {/* Top right - Paper plane */}
              <div className="absolute top-4 right-16">
                <svg className="w-12 h-12 text-[#121A26] opacity-20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </div>

              {/* Top far right - Document with checkmark */}
              <div className="absolute top-8 right-4">
                <div className="w-12 h-16 rounded-sm flex flex-col items-center justify-center relative">
                  <svg className="w-10 h-10 text-[#121A26] opacity-20" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  <div className="absolute bottom-3">
                    <svg className="w-4 h-4 text-[#121A26] opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Middle left - Small document */}
              <div className="absolute top-32 left-16">
                <svg className="w-8 h-10 text-[#121A26] opacity-20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
              </div>

              {/* Middle right - Folder/files */}
              <div className="absolute top-32 right-8">
                <div className="flex space-x-1">
                  <svg className="w-6 h-8 text-[#121A26] opacity-20" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  <svg className="w-6 h-8 text-[#121A26] opacity-20" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              {/* Bottom left - Grid/menu icon */}
              <div className="absolute bottom-20 left-8">
                <svg className="w-12 h-12 text-[#121A26] opacity-20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" />
                </svg>
              </div>

              {/* Bottom center - List items */}
              <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <svg className="w-3 h-3 text-[#121A26] opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div className="w-16 h-1 bg-[#121A26] opacity-20 rounded"></div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-3 h-3 text-[#121A26] opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div className="w-20 h-1 bg-[#121A26] opacity-20 rounded"></div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-3 h-3 text-[#121A26] opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div className="w-18 h-1 bg-[#121A26] opacity-20 rounded"></div>
                  </div>
                </div>
              </div>

              {/* Bottom left corner - Small grid */}
              <div className="absolute bottom-4 left-8">
                <svg className="w-8 h-8 text-[#121A26] opacity-20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>

              {/* Bottom right - Folder with arrow */}
              <div className="absolute bottom-4 right-8">
                <svg className="w-12 h-10 text-[#121A26] opacity-20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-start">
          <div className="mb-8">
            <div className="text-sm text-gray-500 mb-6 text-right">Member</div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome Back!
            </h1>
            <p className="text-gray-600 mb-8">
              Please sign in to proceed further
            </p>
          </div>

          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginComponent;