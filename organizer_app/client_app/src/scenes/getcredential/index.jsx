import React, { useEffect, useState } from 'react';
import { Alert, AlertTitle, colors } from '@mui/material';
import AlertDialog from "../../components/Dialog";
import { Box, Button, Grid, Typography, useTheme, TextField, FormControl } from "@mui/material";
import { Formik, Form, Field } from 'formik';
import Confetti from 'react-confetti'
import { blue } from '@mui/material/colors';
//TODO: CHANGE THIS IN DEPLOYMENT
let BASE_URL = "https://sdsr-ssi-organizer.fp.cloud.bell-labs.com";


const initialValues = { meetingId: "" };
const GiveCredential = ({ api, did }) => {

    const [alertOpen, setAlertOpen] = useState(true);
    const [errormessage, setErrorMessage] = useState("");
    const [successmessage, setSuccessMessage] = useState("")
    const [verificationData, setVerificationData] = useState(null);
    const [meetingId, setMeetingId] = useState("");
    const [currValue, setCurrValue] = useState("");
    const [isorganizer, setIsOrganizer] = useState(false);
    const [error_, setError] = useState(false);
    const [success_, setSuccess] = useState(false);
    const [savingCred, setSavingCred] = useState(false);
    const [issued, setIssued] = useState(false);
    const [done, setDone] = useState(false);

    // Function to close the alert dialog
    const handleCloseAlert = () => {
        setAlertOpen(false);
    };

    // Function to parse the meeting ID from the URL
    const getMeetingIdFromStorage = () => {

        return localStorage.getItem('meeting_id');
    };

    // Function to fetch verification data based on meeting ID
    const fetchVerificationData = async () => {
        try {
            const response = await fetch(`${BASE_URL}/api/meetings/${meetingId}`);
            if (response.ok) {
                const data = await response.json();

                setVerificationData(data.data);
            } else {
                throw new Error('Meeting not found');
            }
        } catch (error) {
            console.error('Error fetching verification data:', error);
            setErrorMessage(error + ", put your meeting Id in the field above and try again");
            setSuccess(false);
            setError(true);
            setAlertOpen(true);
            setTimeout(() => { setAlertOpen(false) }, 5000);
            setVerificationData(null);
        }
    };

    const handleChangeId = (e) => {

        setCurrValue(e.target.value.toString());
        setMeetingId(e.target.value.toString());

    };

    // Function to verify the user's email
    const verifyEmail = async () => {
        const data = JSON.parse(localStorage.getItem('verificationData'))
        const email = data.email;
        if (verificationData === null) {

            setErrorMessage("Sorry no such meeting id exists");
            setSuccess(false);
            setError(true);
            setAlertOpen(true);
            setTimeout(() => { setAlertOpen(false) }, 5000);


        }
        if (!verificationData.Participants.includes(email)) {
            setErrorMessage("Couldn't find you in the list of participants, contact the organizer.");
            setSuccess(false);
            setError(true);
            setAlertOpen(true);
            setTimeout(() => { setAlertOpen(false) }, 5000);
        }

        if (verificationData.Organizer.includes(email)) {
            setIsOrganizer(true);
            setSuccess(false);
            setError(false);
            setAlertOpen(true);
            setTimeout(() => { setAlertOpen(false) }, 5000);
        } else {
            setSuccessMessage("Found you in the list of participants, Issuing you a credential");
            setError(false);
            setSuccess(true);
            setAlertOpen(true);
            setTimeout(() => { setAlertOpen(false) }, 5000);

            let meetingData = {
                id: meetingId,
                organizer: verificationData.Organizer,
                participants: verificationData.Participants,
                startTime: verificationData.StartTime,
                endTime: verificationData.EndTime,
                duration: verificationData.Duration,
                camera_access: verificationData.CameraAccess
            };


            let cameras = meetingData.camera_access;
            cameras = cameras.map(checkbox => checkbox.replace("camera", "").trim());
            const camerasString = cameras.join(";");


            const dataString = Object.entries({
                "meetingStartTime": meetingData.startTime,
                "meetingDuration": meetingData.duration,
                "cameras": camerasString
            }).map(([key, value]) => `${key}=${value}`).join('::');




            let credentialrequest = {
                schema_type: "vcam_meet",
                credential_claims: `${dataString}`,
                issuer_name: 'sdsr',
                holder_did: did.toString()
            }
            setSavingCred(true)
            const res = await fetch("https://sdsr-ssi.fp.cloud.bell-labs.com/api/issue", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(credentialrequest),
            });

            let Result = null;
            if (!res.ok) {

                setError(true);
                setSuccess(false);
                setErrorMessage("Unable to issue you a credential - Issuer API is down");

                setAlertOpen(true);
                setTimeout(() => { setAlertOpen(false) }, 5000);
            } else {

                Result = await res.json();

            }

            if (Result['success'] === true) {
                setIssued(false);
                const res_cred = await api.saveCredential(Result['credential'], {
                    store: ['ceramic', 'snap'],
                });

                if (res_cred['success'] === true) {
                    setSavingCred(false);

                    setError(false);
                    setSuccess(true);
                    setSuccessMessage("Meeting access credential issued");
                    setAlertOpen(true);
                    setTimeout(() => { setAlertOpen(false) }, 5000);

                    let mymeetings = localStorage.getItem('mymeetingsdata');

                    if (mymeetings !== null) {
                        mymeetings = JSON.parse(mymeetings);
                        const meeting_id = `meeting-${meetingData.id}`

                        // Convert ISO strings to Date objects
                        const startTime = new Date(meetingData.startTime);
                        const endTime = new Date(meetingData.endTime);

                        // Format the date and time
                        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', timeZoneName: 'short' };

                        const formattedStartTime = startTime.toLocaleString('en-US', options);
                        const formattedEndTime = endTime.toLocaleString('en-US', options);

                        // TODO: Make it customizable
                        const CAMERA_GUI_URL = "https://sdsr-ssi-camera.fp.cloud.bell-labs.com"

                        // const CAMERA_GUI_URL = "http://localhost:3000"; // just for demo
                        mymeetings[meeting_id] = {
                            id: meetingData.id,
                            organizer: meetingData.organizer,
                            start_time: formattedStartTime,
                            end_time: formattedEndTime,
                            url: `${CAMERA_GUI_URL}`,
                            status: "Upcoming"

                        }


                        localStorage.setItem('mymeetingsdata', JSON.stringify(mymeetings))
                    }

                    setTimeout(() => {
                        setDone(false);
                    }, 5000);
                } else {
                    setSuccess(false);
                    setErrorMessage("Unable to save to your wallet");
                    setError(true);
                    setAlertOpen(true);
                    setTimeout(() => { setAlertOpen(false) }, 5000);
                }

            } else {
                setSuccess(false);
                setErrorMessage("Error issuing credential. Please try again later");
                setError(true);
                setAlertOpen(true);
                setTimeout(() => { setAlertOpen(false) }, 5000);
            }
        }



    };

    useEffect(() => {
        const meeting_id = localStorage.getItem('meeting_id');
        // setMeetingId(meeting_id);

        async function verifyme() {
            await verifyEmail();
        }

        if (meetingId !== "" || meetingId !== null) {
            fetchVerificationData();
            if (verificationData !== null) {
                verifyme();
            }

        }
    }, [api, did, meetingId]);

    return (
        <Box m="20px">
            <Formik
                initialValues={initialValues}
                onSubmit={async (values) => {

                    setMeetingId(meetingId);
                    fetchVerificationData();
                    if (verificationData !== null) {
                        await verifyEmail();
                    }

                }}
            >
                {({ values, handleChange, handleSubmit }) => (
                    <form onSubmit={handleSubmit}>


                        <Box alignContent="center" alignItems="center" justifyContent="center" display="flex">
                            <Typography variant="h1" fontWeight="bold" mt="200px" gutterBottom gridColumn={"span 4"}>
                                Meeting ID
                            </Typography>
                        </Box>
                        <Box alignContent="center" alignItems="center" justifyContent="center" display="flex">

                            <Typography variant="h6" mt="10px" gutterBottom>
                                Enter your meeting id and get your credential
                            </Typography>
                        </Box>

                        <Box alignContent="center" mt="3px" alignItems="center" justifyContent="center" display="flex">
                            <FormControl>
                                <TextField

                                    name="meetingId"
                                    label="meetingId"
                                    style={{ width: 700 }}
                                    size="medium"
                                    variant="outlined"
                                    value={meetingId}
                                    onChange={handleChangeId}
                                />

                            </FormControl>
                        </Box>
                        <Box display="flex" justifyContent="center" mt={5}>
                            <Button type="submit" color='primary' variant="contained" style={{ width: 200 }}>
                                Submit
                            </Button>
                        </Box>

                    </form>
                )}
            </Formik>

            {(savingCred) && (
                (<AlertDialog
                    title={"Issuing you the Access Credential"}
                    description={"Approve saving the credential to your wallet"}
                    loading={true}
                    success={false}

                />)
            )}
            {(done) && <AlertDialog
                title={"Meeting Created"}
                description={"Congratulations, you have been issued the credential, join the meeting under `Join a Meeting` tab later."}
                loading={true}
                success={false}

            />}
            {isorganizer && alertOpen && (<Box position="fixed" bottom="10px" right="10px">
                <Alert severity="warning" onClose={handleCloseAlert} open={alertOpen} sx={{
                    width: "300px",
                    minHeight: "100px",
                }}>
                    <AlertTitle>Warning</AlertTitle>
                    You are the organizer and have a verifiable credential for this meeting already. Head to Join Meeting tab whenever the time comes.
                </Alert>
            </Box>)
            }
            {(done) && <Confetti />}
            {alertOpen && error_ && (<Box position="fixed" bottom="10px" right="10px">
                <Alert severity="error" onClose={handleCloseAlert} open={alertOpen} sx={{
                    width: "300px",
                    minHeight: "100px",
                }}>
                    <AlertTitle>Error</AlertTitle>
                    {errormessage}
                </Alert>
            </Box>)
            }
            {alertOpen && success_ && (<Box position="fixed" bottom="10px" right="10px">
                <Alert severity="success" onClose={handleCloseAlert} open={alertOpen} sx={{
                    width: "300px",
                    minHeight: "100px",
                }}>
                    <AlertTitle>Success</AlertTitle>
                    {successmessage}
                </Alert>
            </Box>)
            }
        </Box>
    );
};

export default GiveCredential;
