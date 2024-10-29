import React from 'react';
import { Formik, Form, Field } from 'formik';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Grid from "@mui/material/Grid"
import * as yup from "yup";
import { useState, useEffect } from "react";
import useMediaQuery from "@mui/material/useMediaQuery";
import * as EmailValidator from 'email-validator';
import { blue } from '@mui/material/colors';
import {
  Chip,
  FormControl,
  TextField,
  Typography,
  Alert,
  AlertTitle,
  Stack
} from "@mui/material";

const initialValues = {
  emails: [],
};

function extractEmail(currValue) {
  const regex = /<([^>]+)>/;
  const match = currValue.match(regex);
  if (match) {
      return match[1]; // Extracted email address
  } else {
      return currValue; // If no email address is found
  }
}

const Participation = ({ verifiedData, activeStep, setActiveStep, completed, setCompleted }) => {
    const isNonMobile = useMediaQuery("(min-width:600px)");
    const [emails, setEmails] = useState([verifiedData.email || ""]);
    const [currValue, setCurrValue] = useState("");
    const [alertOpen, setAlertOpen] = useState(false);
    const [error_,setError] = useState(false);
    const [success_,setSuccess] = useState(false);
    const [errormessage,setErrorMessage]= useState("");
    const [successmessage,setSuccessMessage]= useState("");
    

    const handleKeyUp = (e) => {
        if (e.keyCode === 32 || e.keyCode === 13) {
            const isValidEmail = EmailValidator.validate(currValue);
            if (isValidEmail) {
                setEmails((oldState) => [...oldState, currValue]);
                setCurrValue("");
            } else {
                setAlertOpen(true);
                setTimeout(()=>{setAlertOpen(false)},5000);
            }
        }
    };

    const handleCloseAlert = () => {
        setAlertOpen(false);
    };

    const handleDeleteEmail = (index) => {
      let arr = [...emails]
      arr.splice(index, 1)
      setEmails(arr)
    }

    // useEffect(() => {
        
    // }, [emails]);

    const handleChangeEmail = (e) => {
        setCurrValue(e.target.value);
    };
    const handleAddEmail=( )=>{
      const emails_value = currValue;
      
      const emailsArray = emails_value.split(';');
      const emailArray = emails;
      
      for (const index in emailsArray){
        
        const email_value = extractEmail(emailsArray[index].trim());
        const isValidEmail = EmailValidator.validate(email_value);
        if (isValidEmail) {
          emailArray.push(email_value);
        } else {
            setAlertOpen(true);
            setTimeout(()=>{setAlertOpen(false);setError(true);setErrorMessage("Invalid email, please add a valid email address")},5000);
        }
        
      }
      setEmails(emailArray);
      setCurrValue("");
    }

    return (
      <Box m="20px">
        <Formik
          initialValues={initialValues}
          onSubmit={(values, { resetForm }) => {
            const allEmails = [...emails, currValue];

            setAlertOpen(true);
            setSuccess(true);
            setSuccessMessage("Successfully added list of participants");
            setEmails(allEmails);
            resetForm();
            setActiveStep(activeStep + 1);
            const new_complete = completed;
            new_complete[activeStep] = true;
            setCompleted(new_complete);
            setTimeout(()=>{
              setAlertOpen(false);
            },4000);
            localStorage.setItem("allemails", JSON.stringify({ emails: allEmails }));
          }}
        >
           {({ values, handleChange, handleSubmit }) => (
            <form onSubmit={handleSubmit}>
                  <Box alignContent="center" alignItems="center" justifyContent="center" display="flex">
                        <Typography variant="h1" fontWeight="bold" mt="40px" gutterBottom>
                            List the Participants
                        </Typography>
                    </Box>
                    <Box alignContent="center" alignItems="center" justifyContent="center" display="flex">

                      <Typography variant="h6"  mt="0.1px" gutterBottom>
                          Add valid email addresses of your meeting participants below
                      </Typography>
                    </Box>
                    
                    <Box alignContent="center" alignItems="center" ml={6} justifyContent="flex-start" display="flex">
                        <Typography variant="h2" fontWeight="bold" gutterBottom >
                            Your Participants
                        </Typography>
                    </Box>
                    {/* <Box alignContent="center" alignItems="center" display="flex" mb="5px" mt="10px" ml="150px" mr="100px">
                        
                          
                      </Box> */}
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-around"
                        alignContent="center"
                        gap="80px"
                        // gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                        // sx={{
                        //   "& > div": { gridColumn: "span 6" },
                        // }}
                      >
                      <Stack rowGap={0.1} display="absolute" ml={5}>
                        {emails.map((item, index) => (
                                <Chip
                                  key={index}
                                  size="large"
                                  onDelete={() => handleDeleteEmail(index)}
                                  label={item}
                                  style={{ backgroundColor: '#1976d2', color: '#ffffff',width:'auto' }}
                                />
                              ))}
                      </Stack>
                        
                      <FormControl>
                        
                          <TextField
                            style = {{width: 700}}
                            value={currValue}
                            onChange={handleChangeEmail}
                            // sx={{ gridColumn: "span 6" }}
                          />
                      </FormControl>
                      
                      <Box display="flex" justifyContent="center">
                        <Button type="submit" color='primary' variant="contained" style = {{width: 200,height:50}}>
                            Submit Selections
                        </Button>
                      </Box>
                    </Box>
                    <Box display="flex" justifyContent="center">
                      <Button onClick={handleAddEmail} display="flex" justifyContent="center" variant='contained' alignContent="center" color="primary" alignItems='center'  style = {{width: 200,height:50}}>
                                  Add Participant
                        </Button>
                    </Box>
                    
                    
            </form>
        )}
        </Formik>

        {/* Error Alert */}
        {alertOpen && error_&& (<Box position="fixed" bottom="10px" right="10px">
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

export default Participation;
