import React, { useEffect, useState } from 'react';
import { Formik, Form, Field } from 'formik';
import { TextField, Button, Typography, Box, Snackbar, IconButton } from '@mui/material';
import ShareIcon from "@mui/icons-material/Share";
import AlertDialog from './Dialog';
import Confetti from 'react-confetti'
import {
  Alert,
  AlertTitle
} from "@mui/material";

import { blue } from '@mui/material/colors';
const initialValues = {
  from: '',
  to: '',
  body: '',
};

//TODO: CHANGE THIS IN DEPLOYMENT
let BASE_URL = "https://sdsr-ssi-organizer.fp.cloud.bell-labs.com";


// Function to make a POST request to create a meeting
const createMeeting = async (data) => {
  try {
    console.log(data);
    const response = await fetch(`${BASE_URL}/api/meetings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        'Accept': 'application/json'
      },
      mode: "cors",
      body: JSON.stringify(data)
    });

    console.log(response);
    const responseData = await response.json();
    return { data: responseData, error: "", status: response.status };
  } catch (error) {
    console.error("Error creating meeting:", error);
    return { data: "", error: error.message, status: 500 };
  }
};

const EmailForm = ({ api, did, activeStep, setActiveStep, completed, setCompleted }) => {
  // Get emails from localStorage
  const emails_object = JSON.parse(localStorage.getItem('allemails')) || {};

  const emails = emails_object['emails'] || null;
  const from = emails[0] || '';
  const to = emails.slice(1, -1).join('; ');
  const body = `
  Hello all,

  I'm inviting you folks to test out the SSI demo for organizing and joining meetings. You have been randomly assigned access to a few cameras through which you can spot a few objects.

  You will need to go to: "${BASE_URL}?meetingid=${sessionStorage.getItem('new_meeting_id')}" to get your verifiable credential to access the media server with the cameras. 

  You can receive your credential under the section "Meeting Credential" on the sidebar.

  Once you have received your credential, check the "Join a meeting" section on the sidebar wherein you can see a table with active and inactive meetings, click on the link and go to media server.

  Thanks.

  Best,
  Organizer
  `

  const [savingCred, setSavingCred] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);

  const [alertOpen, setAlertOpen] = useState(false);
  const [errormessage, setErrorMessage] = useState("");
  const [successmessage, setSuccessMessage] = useState("")
  const [issued, setIssued] = useState(false);
  const [openBar, setopenBar] = useState(false);
  const [done, setDone] = useState(false);
  const [error_, setError] = useState(false);
  const [success_, setSuccess] = useState(false);

  const handleCloseAlert = () => {
    setAlertOpen(false);
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setopenBar(true)
  };

  const handleSubmission = () => {
    setDone(true);
    // setActiveStep(activeStep + 1);
    // const new_complete = completed;
    // new_complete[activeStep] = true;
    // setCompleted(new_complete);
    setTimeout(() => {
      setDone(false);
    }, 10000);

  }
  const handleSubmitNew = async () => {


    // processing event data
    const eventsData = JSON.parse(localStorage.getItem('allevents'));
    const eventDataArray = Object.values(eventsData);
    const event = eventDataArray[eventDataArray.length - 1];

    const startTime = new Date(event.start_time).toISOString();
    const endTime = new Date(event.end_time).toISOString();

    const startTime_ = new Date(event.start_time).getTime(); // Convert to milliseconds
    const endTime_ = new Date(event.end_time).getTime(); // Convert to milliseconds

    const durationInMilliseconds = endTime_ - startTime_;
    const duration = durationInMilliseconds / (1000 * 60);

    const meeting_id = event.id;

    // processing camera data
    const cameras_object = JSON.parse(localStorage.getItem('allcameras')) || {};
    let cameras = cameras_object['cameras'];

    let meetingData = {
      id: meeting_id,
      organizer: from,
      participants: emails.slice(0, -1).join(","),
      startTime: startTime,
      endTime: endTime,
      duration: duration.toString(),
      camera_access: cameras
    };

    cameras = cameras.map(checkbox => checkbox.replace("camera", "").trim());
    const camerasString = cameras.join(";");


    const dataString = Object.entries({
      "meetingStartTime": startTime,
      "meetingDuration": duration,
      "cameras": camerasString
    })
      .map(([key, value]) => `${key}=${value}`)
      .join('::');


    console.log("new");

    let credentialrequest = {
      schema_type: "vcam_meet",
      credential_claims: `${dataString}`,
      issuer_name: 'sdsr',
      holder_did: did.toString()
    }

    const issuing_done = sessionStorage.getItem('issuing_done');
    console.log(credentialrequest);
    if (issuing_done !== true) {

      setSavingCred(true)
      const res = await fetch("https://sdsr-ssi.fp.cloud.bell-labs.com/api/issue", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(credentialrequest),
      });
      console.log(res);
      console.log(JSON.stringify(credentialrequest));

      let Result = null;
      if (!res.ok) {

        setError(true);
        setSuccess(false);
        setAlertOpen(true);
        setErrorMessage("Unable to issue you a credential - Issuer API is down");
        setTimeout(() => { setAlertOpen(false) }, 5000);
      } else {

        Result = await res.json();

      }

      if (Result['success'] === true) {
        const res_cred = await api.saveCredential(Result['credential'], {
          store: ['ceramic', 'snap'],
        });

        if (res_cred['success'] === true) {
          setSavingCred(false);
          setIssued(true);
          setError(false);
          setSuccess(true);
          setSuccessMessage("Meeting access credential issued");
          setAlertOpen(true);
          setTimeout(() => { setAlertOpen(false) }, 5000);
          sessionStorage.setItem('issuing_done', true);
          const save_meeting = sessionStorage.getItem('save_meeting');

          if (save_meeting !== true) {
            setSavingDetails(true);
            let final_response = await createMeeting(meetingData);

            console.log(final_response);
            // final_response = await res.json()
            if (final_response.error !== "") {
              setError(true);
              setSuccess(false);
              setErrorMessage("Couldnot save meeting details in the database");
              setAlertOpen(true);
              setTimeout(() => { setAlertOpen(false) }, 5000);


            } else {
              setSavingDetails(false);
              setError(false);
              setSuccessMessage("Saved meeting details in the database");
              setSuccess(true);

              setAlertOpen(true);
              setTimeout(() => { setAlertOpen(false) }, 5000);


              let mymeetings = localStorage.getItem('mymeetingsdata');

              if (mymeetings !== null) {
                mymeetings = JSON.parse(mymeetings);
                const meeting_id = `meeting-${meetingData.id}`

                // TODO: Make it customizable
                const CAMERA_GUI_URL = "https://sdsr-ssi-camera.fp.cloud.bell-labs.com";
                // const CAMERA_GUI_URL = "http://localhost:3000"; // just for demo
                mymeetings[meeting_id] = {
                  id: meetingData.id,
                  organizer: meetingData.organizer,
                  start_time: meetingData.startTime,
                  end_time: meetingData.endTime,
                  duration: meetingData.duration,
                  url: `${CAMERA_GUI_URL}`,
                  status: "Upcoming"

                }
                localStorage.setItem('mymeetingsdata', JSON.stringify(mymeetings));
                sessionStorage.setItem('save_meeting', true);
              }


            }
          }



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

    // EMAIL SESSION
    // emailjs.send('service_aq9t6xb', 'YOUR_TEMPLATE_ID', {
    //   from_email: values.from,
    //   to_email: values.to,
    //   message_html: values.body,
    // }, 'YOUR_USER_ID')
    // .then((response) => {
    //   console.log('Email sent successfully:', response);
    //   resetForm();
    // }, (error) => {
    //   console.error('Error sending email:', error);
    // });
  };

  useEffect(() => {

    if (api !== null && did !== "") {
      handleSubmitNew();
    }
  }, [api, did])
  return (

    <Box p={2}>
      <Box alignContent="center" alignItems="center" justifyContent="center" display="flex">
        <Typography variant="h1" mt="10px" fontWeight="bold" gutterBottom>
          The Final Step - Sent the Invitation
        </Typography>
      </Box>
      <Box alignContent="center" alignItems="center" justifyContent="center" display="flex">

        <Typography variant="h6" mt="3px" gutterBottom>
          Copy the Template below and send your email via outlook
        </Typography>
      </Box>
      <Formik initialValues={initialValues}>
        {({ values, handleChange, handleSubmit }) => (
          <Form>
            <Box display="flex" alignItems="center">
              <Field
                as={TextField}
                name="from"
                label="From"
                fullWidth
                variant="outlined"
                value={from}
                onChange={handleChange}
              />
              <IconButton onClick={() => handleCopyToClipboard(from)} color="primary">
                <ShareIcon />
              </IconButton>
            </Box>
            {/* Repeat the same pattern for 'to' and 'body' fields */}
            <Box display="flex" alignItems="center">
              <Field
                as={TextField}
                name="to"
                label="To"
                fullWidth
                variant="outlined"
                value={to}
                onChange={handleChange}
                multiline
              />
              <IconButton onClick={() => handleCopyToClipboard(to)} color="primary">
                <ShareIcon />
              </IconButton>
            </Box>
            <Box display="flex" alignItems="center">
              <Field
                as={TextField}
                name="body"
                label="Body"
                fullWidth
                variant="outlined"
                value={body}
                onChange={handleChange}
                multiline
                rows={10}
              />
              <IconButton onClick={() => handleCopyToClipboard(body)} color="primary">
                <ShareIcon />
              </IconButton>
            </Box>


          </Form>
        )}
      </Formik>
      <Box display="flex" justifyContent="center" mt="20px">
        <Button style={{ width: 300, height: 50 }} onClick={() => handleSubmission()} color="primary" variant="contained">
          Completed
        </Button>
      </Box>
      <Snackbar
        message="Copied to clibboard"
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        autoHideDuration={2000}
        onClose={() => setopenBar(false)}
        open={openBar}
      />

      {(savingCred) && (
        (<AlertDialog
          title={"Issuing you the Access Credential"}
          description={"Approve saving the credential to your wallet"}
          loading={true}
          success={false}

        />)
      )}
      {(savingDetails) && (
        (<AlertDialog
          title={"Saving Meeting Details"}
          description={"Meeting details are being saved in a database"}
          loading={true}
          success={false}

        />)
      )}
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
      {(done) && <AlertDialog
        title={"Meeting Created"}
        description={"Congratulations, meeting has been created, join the meeting under Join a Meeting section on the sidebar later."}
        loading={false}
        success={false}

      />}
      {(done) && <Confetti />}
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

export default EmailForm;
