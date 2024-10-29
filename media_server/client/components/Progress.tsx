import React from 'react';
import { Triangle } from 'react-loader-spinner';

const Progress = () => {
    return <div className="h-screen">
        <div className="max-h-full">
            <div className="flex flex-col items-center mt-16">
                <div className="mb-6">
                    <Triangle
                        type="TailSpin" // Change the type of spinner here (e.g., BallTriangle, Bars, etc.)
                        color="#0070f3" // Change the color of the spinner here
                        height={100}
                        width={100}
                    />
                </div>
                <div className="flex flex-col justify-center items-center text-blue-600">
                    <div className="font-mono">
                        Logging in with SDSR SSI...
                    </div>
                    <div className="bg-gray-300 rounded-lg bg-opacity-50 shadow-lg p-4 mt-4 italic text-sm">
                        We are asking for your freshest type "{process.env.NEXT_PUBLIC_VC_FILTER_TYPE}" credential.
                    </div>
                </div>
            </div>
        </div>
    </div>
};

export default Progress;
