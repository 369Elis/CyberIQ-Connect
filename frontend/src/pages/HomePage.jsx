import React from "react";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-8">Cyber IQ Connect</h1>
      <p className="text-xl mb-12">Your cybersecurity learning platform</p>
      <div className="flex gap-4">
        <a
          href="/login"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded"
        >
          Login
        </a>
        <a
          href="/register"
          className="border border-blue-600 text-blue-400 hover:bg-blue-900 px-6 py-3 rounded"
        >
          Register
        </a>
      </div>
    </div>
  );
};

export default HomePage;
