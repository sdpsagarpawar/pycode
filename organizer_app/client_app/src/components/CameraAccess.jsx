import React from 'react';
import { Formik, Form, Field } from 'formik';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Grid from "@mui/material/Grid";
import {Alert} from '@mui/material';
import * as yup from "yup";
import { useState, useEffect } from "react";
import useMediaQuery from "@mui/material/useMediaQuery";

import {
  AlertTitle,
  Chip,
  FormControl,
  TextField,
  Typography
} from "@mui/material";
import { blue } from '@mui/material/colors';

const initialValues = {
  cameras: [],
};

const camerasOptions = [
  { label: 'Camera 1', value: 'camera1' },
  { label: 'Camera 2', value: 'camera2' },
  { label: 'Camera 3', value: 'camera3' },
];

const CameraAccess = ({cameras, setCameras, activeStep, setActiveStep, completed, setCompleted }) => {
    const isNonMobile = useMediaQuery("(min-width:1000px)");
    const [error_,setError] = useState(false);
    const [success_,setSuccess] = useState(false);
    const [errormessage,setErrorMessage]= useState("");
    const [successmessage,setSuccessMessage]= useState("");
    const [alertOpen, setAlertOpen] = useState(false);
    const handleCloseAlert = () => {
      setAlertOpen(false);
  };
    return (
      <Box m="20px">
        <Formik
          initialValues={initialValues}
          onSubmit={(values) => {
            setAlertOpen(true);
            setSuccess(true);
            setSuccessMessage("Successfully submitted access to cameras for the participants");
            setCameras(values)
            setActiveStep(activeStep + 1)
            const new_complete = completed;
            new_complete[activeStep] = true
            setTimeout(()=>{
              setAlertOpen(false);
              setSuccess(false);
            },4000);
            setCompleted(completed);
            
            localStorage.setItem('allcameras',JSON.stringify(values));
          }}
        >
           {({ values, handleChange, handleSubmit }) => (
          <form onSubmit={handleSubmit}>
            
              <Box alignContent="center" alignItems="center" justifyContent="center" display="flex">
                  <Typography variant="h1" mt="40px" fontWeight="bold" gutterBottom>
                    Access to Cameras
                  </Typography>
                </Box>
                <Box alignContent="center" alignItems="center" justifyContent="center" display="flex">

                        <Typography variant="h6"  mt="10px" gutterBottom>
                            Since you are the organizer, you get to decide who gets access to which camera
                        </Typography>
                </Box>
                <Box alignContent="center" alignItems="center" mt="3px" justifyContent="center" display="flex">

                  {camerasOptions.map((option) => (
                      <FormControlLabel
                        key={option.value}
                        control={
                          <Checkbox
                            checked={values.cameras.includes(option.value)}
                            onChange={handleChange}
                            name="cameras"
                            value={option.value}
                            defaultChecked 
                            size='large'
                          />
                        }
                        label={option.label}
                      />
                    ))}
                  
                </Box>
                <Box display="flex" justifyContent="center" alignItems='center' alignContent='center' mt={5}>
                  <Button type="submit" color='primary' variant="contained" style = {{width: 200}}>
                    Submit Selections
                  </Button>
                </Box>
              
          </form>
        )}
        </Formik>
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

export default CameraAccess;
