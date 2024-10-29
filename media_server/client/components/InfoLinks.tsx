import React from 'react';
import Link from 'next/link';

const InfoLinks = () => {
    return <div className="fixed z-50 top-4 right-4">
        <div className="flex flex-col">
            <Link
                href="mailto:manzoor.a.khan@nokia-bell-labs.com"
                className="bg-gray-300 text-black py-2 px-4 rounded-md shadow-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 mb-8 text-center">
                External Contact
            </Link>
        </div>
    </div>;
};

export default InfoLinks;
