import React from 'react';

const TitlePurpose = ({ title, purpose }) => {
    return (
        <div className="flex flex-col text-center mt-8">
            <div
                className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-green-500 text-transparent bg-clip-text">
                IoT Camera Access with SSI
            </div>
            {title || purpose ?
                <div className="flex flex-col justify-center items-center m-8 p-4">
                    {title !== "" &&
                        <div
                            className="text-2xl bg-gradient-to-r from-blue-500 to-green-500 text-transparent bg-clip-text">
                            {title}
                        </div>
                    }
                    {purpose !== "" &&
                        <div className="text-center italic mt-4">
                            {purpose}
                        </div>
                    }
                </div> : null
            }
        </div>
    );
};

export default TitlePurpose;
