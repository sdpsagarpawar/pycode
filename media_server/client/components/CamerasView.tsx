import React, { useEffect, useState } from "react";
import WarrningMessage from "./WarrningMessage";

const CamerasView = ({ vp }) => {
    const cameraFeedURL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/camera-feed/`;

    const [cameraIDs, setCameraIDs] = useState<number[]>([]);
    const [unauth, setUnauth] = useState<boolean>(false);

    function parseCameraIDs(vp) {
        try {
            const vc = vp["verifiableCredential"][0];

            const camString: string = JSON.parse(vc)["credentialSubject"]["cameras"];
            const cameras = camString.split(";").map(s => parseInt(s, 10));
            setCameraIDs(cameras);
            console.log(cameras)
        } catch (error) {
            console.error(`Failed to parse cameras string: ${error.message}`);
        }
    }

    async function auth(vp) {
        try {
            console.log("Authenticating...");

            // Authenticate with the backend
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(vp),
            });

            if (response.status === 401) {
                setUnauth(true)
                return
            } else if (!response.ok) {
                console.log("Server returned non-OK, non-UNAUTHORIZED response.");
                throw Error
            }

            // Set SID as cookie
            const responseJSON = await response.json();
            document.cookie = `sid=${responseJSON.sid}`;

            // Get camera IDs from the VP
            parseCameraIDs(vp);
        } catch (error) {
            console.error(`Backend responded with an error: ${error}`)
        }
    }

    useEffect(() => {
        auth(vp)
    }, [vp]);

    function getSIDQueryParam(): String {
        return "?sid=" + document.cookie.split("=")[1]
    }

    if (unauth) {
        return <WarrningMessage title="" message="Access not granted." />
    }

    return <div className="flex flex-wrap items-center justify-center py-1 min-h-screen">
        {cameraIDs.map(cam_id => (
            <div className="h-auto w-1/2" key={cam_id}>
                <div className="flex flex-col justify-center items-center p-2 m-4 rounded-lg shadow-lg bg-gray-300">
                    <div className="justify-center items-center mb-4 font-bold font-mono">
                        Camera {cam_id}
                    </div>
                    <img src={cameraFeedURL + cam_id + getSIDQueryParam()} width="100%" />
                </div>
            </div>
        ))}
    </div>;
};

export default CamerasView;
