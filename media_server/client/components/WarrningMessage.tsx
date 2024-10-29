import React from 'react';
import PropTypes from 'prop-types';

const WarrningMessage = ({ title = "Warrning", message }) => {
    return <div className="h-screen">
        <div className="max-h-full">
            <div className="flex justify-center mt-16">
                <div className="bg-orange-300 rounded-lg bg-opacity-50 shadow-lg border-2 border-solid border-orange-500 p-4 text-center">
                    <div className="font-bold text-orange-500 italic">
                        {title}
                    </div>
                    <div className="italic">
                        {message}
                    </div>
                </div>
            </div>
        </div>
    </div>
};

WarrningMessage.propTypes = {
    message: PropTypes.string.isRequired
};

export default WarrningMessage;
