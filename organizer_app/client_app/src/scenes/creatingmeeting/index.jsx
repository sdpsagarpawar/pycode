import Header from "../../components/Header";
import HorizontalNonLinearStepper from "../../components/Stepper"
import AlertDialog from "../../components/Dialog";
import { Box, Button, IconButton, Typography, useTheme,AlertTitle } from "@mui/material";
import Alert from '@mui/material/Alert';
import Calendar from "../../components/Calendar";
import InviteForm from "../../components/Participants";
import CameraAccess from "../../components/CameraAccess";
import EmbeddedLink from "../../components/EmbeddedLink";
import EmailForm from "../../components/SendInvite";
import { useState,useEffect } from "react";
import { ColorModeContext,tokens } from "../../theme";
import Grid from '@mui/material/Grid';
import { graphfi, GraphBrowser } from "@pnp/graph";
import { MSAL } from "@pnp/msaljsclient";
// import "@pnp/sp/webs";
// import "@pnp/graph/users";
import { v4 as uuidv4 } from 'uuid';
import { msalConfig,loginRequest as authParams } from '../../authConfig';
import "@pnp/graph/users";
import Participation from "../../components/Participants";
import { Navigate } from "react-router-dom";

const getMeetingIdFromURL = () => {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get('meeting_id');
};


const CreateMeeting = ({ api,did,currentEvents,setCurrentEvents }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const query = `$[?(@.data.credentialSubject.type == "nokian")]`;
    const metaMaskErrorMessage = "Your MetaMask/Masca does not load. Make sure your MetaMask is set up and connected to your Masca.";
    const [walletLoaded, setWalletLoaded] = useState(false);
    const [metaMaskFailed, setMetaMaskFailed] = useState(false);
    const [apiSet,setApiDone] = useState(false);
    const [vp, setVP] = useState(null);
    const [verified,setVerificationDone] =  useState(false);
    const [verifiedData,setVerifiedData] = useState({});
    const [hasNokian,sethasNokian] = useState(false);
    const steps = ['Select a meeting time on the calendar', 'Configure Access to Cameras','List the Participants','Send the Invite'];
    const [activeStep, setActiveStep] = useState(0);
    const [completed, setCompleted] = useState({});
    const [redirected, setRedirected] = useState(false);
    const [alert, setAlert] = useState(false);
    const [alertContent, setAlertContent] = useState('');
    const [approveSharing, setapproveSharing] = useState(false);
    const [approveCreate, setapproveCreate] = useState(false);
    const [alertOpen, setAlertOpen] = useState(false);
    const initialEvents = {
        event1: {id:`${uuidv4()}`,title:"meeting1",start:"2024-03-27T09:30:00+01:00",end:"2024-03-27T10:30:00+01:00",allDay:false,start_time:"2024-03-27T09:30:00+01:00",end_time:"2024-03-27T10:30:00+01:00"},
        event2: {id:`${uuidv4()}`,title:"meeting2",start:"2024-03-30T16:30:00+01:00",end:"2024-03-30T17:30:00+01:00",allDay:false,start_time:"2024-03-30T16:30:00+01:00",end_time:"2024-03-30T17:30:00+01:00"},
    };
    
    const handleCloseAlert = () => {
        setAlertOpen(false);
    };

    const [cameras,setCameras] = useState([]);

    const [companyEmails, setCompanyEmails] = useState([]);

    // TODO: get company emails
    // useEffect(() => {
    //     fetchCompanyEmails();
    // }, []);

    const fetchCompanyEmails = async () => {
        try {
            // within a webpart, application customizer, or adaptive card extension where the context object is available
            const graph = graphfi().using(GraphBrowser(), MSAL(msalConfig, authParams));
            // need to get company emails TODO: ask admin of azure AD Nokia 
            const response = await graph.me();
            
            const emails = response.map(user => user.mail);
            console.log(emails);
            setCompanyEmails(emails);
        } catch (error) {
            console.error('Error fetching company emails:', error);
        }
    };
    
    useEffect(() => {
        // Check if the user has already been redirected
        const redirectStatus = sessionStorage.getItem('redirected');
        if (redirectStatus === 'true') {
            // If already redirected, set redirected to true
            setRedirected(true);
        }
    }, []);

    


    const createPresentation = async () => {
        try {
            
            if (!api) {
                throw new Error("Waiting to load...");
            } else {
                setApiDone(true);
            }

            var hasVCS = localStorage.getItem('vcs');
            let vcs = null;
            if ( hasVCS===null ) {
                
                vcs = await api.queryCredentials({
                    filter: {
                        type: 'JSONPath',
                        filter: query,
                    },
                    options: {
                        returnStore: true,
                    },
                });

                if (vcs.data.length === 0){
                    sethasNokian(false);
                }
                
                localStorage.setItem('vcs', JSON.stringify(vcs));
            }else{
                vcs = JSON.parse(hasVCS);
            }
            setapproveSharing(true);


            
            
            if (vcs.success && vcs.data.length > 0) {
                sethasNokian(true);
                vcs.data.sort(
                    (a, b) => Date.parse(b.data.issuanceDate) - Date.parse(a.data.issuanceDate));
                
                var hasVPS = localStorage.getItem('vps');
                let presentation = null;
                if ( hasVPS===null ) {
                    presentation = await api.createPresentation({
                        vcs: [vcs.data[0].data],
                        proofFormat: 'EthereumEip712Signature2021'
                    });
                    localStorage.setItem('vps', JSON.stringify(presentation));
                }else{
                    presentation = JSON.parse(hasVPS);
                }
                
                console.log(presentation.data);
                setVP(presentation.data);
                setapproveCreate(true);

                // TODO: check for Verification with deployed URL, issue - CORS
                
                // var isverified = localStorage.getItem('isverified');
                // let vcs = null;
                // if ( hasVCS===null ) {
                //     vcs = await api.queryCredentials({
                //         filter: {
                //             type: 'JSONPath',
                //             filter: query,
                //         },
                //         options: {
                //             returnStore: true,
                //         },
                //     });
                //     localStorage.setItem('vcs', vcs);
                // }else{
                //     vcs = hasVCS;
                // }
                // const response = await fetch("https://sdsr-ssi.fp.cloud.bell-labs.com/verifier", {
                //     method: 'POST',
                //     headers: {
                //         'Content-Type': 'application/json',
                //     },
                //     body: JSON.stringify(vp),
                // });
    
                //const verificationResult = await response.json();
            

                //if (verificationResult.success) {
                if (true){
                    setVerificationDone(true);
                    
                    const verData = JSON.parse(presentation.data.verifiableCredential[0]).credentialSubject;
                    
                    if (verData !== undefined && verData['@context'] !== undefined) {
                        delete verData['@context'];
                    }

                    setVerifiedData(verData);

                    localStorage.setItem('verified',true);
                    localStorage.setItem('verificationData',JSON.stringify(verData));
                    setAlertOpen(true);
                    setTimeout(()=>{setAlertOpen(false)},5000);

                } else {
                    setVerificationDone(false);
                }
                
                
            } else {
                sethasNokian(false);
                setVP(null);
                
            }
            setWalletLoaded(true);
            setMetaMaskFailed(false);
            
        } catch (error) {
            console.error(error.message);
            setAlertContent("Something went wrong: " + error.message);
            setMetaMaskFailed(true);
        }
    };

    useEffect(() => {

        
        const verificationStatus = localStorage.getItem('verified');
        const veriData = localStorage.getItem('verificationData');
        const events_0 = localStorage.getItem('allevents');
        if (events_0===null){
            const currentevents = localStorage.setItem('allevents',JSON.stringify(initialEvents));
        }
        
        if (verificationStatus){
            setVerificationDone(true);
            setVerifiedData(JSON.parse(veriData));
        }
        if (api !== null && verificationStatus!==true) {
            createPresentation();
        }

        const meetingId = getMeetingIdFromURL();

        if (meetingId!==null){
            localStorage.setItem('meeting_id',meetingId);
        }

        setTimeout(()=>{
            setAlertOpen(false)
        },10000);
    }, [api,did]);

    return (
        <Box>
            <Header title="Meeting Creation" subtitle="Welcome to the organizer" />
            <Box display="flex" justifyContent="center" alignItems="center">
                
                {
                    (verified) && (
                        <Box>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <HorizontalNonLinearStepper steps={steps} activeStep={activeStep} setActiveStep={setActiveStep} completed={completed} setCompleted={setCompleted} />
                                </Grid>
                                <Grid item xs={12}>
                                    {activeStep === 0 && <Calendar currentEvents={currentEvents} setCurrentEvents={setCurrentEvents} activeStep={activeStep} setActiveStep={setActiveStep}  completed={completed} setCompleted={setCompleted}/>}
                                    {activeStep === 1 && <CameraAccess cameras={cameras} setCameras={setCameras} activeStep={activeStep} setActiveStep={setActiveStep}  completed={completed} setCompleted={setCompleted}/>}
                                    {activeStep === 2 && <Participation verifiedData={verifiedData}  activeStep={activeStep} setActiveStep={setActiveStep}  completed={completed} setCompleted={setCompleted}/>}
                                    {activeStep === 3 && <EmailForm api={api} did={did} activeStep={activeStep} setActiveStep={setActiveStep}  completed={completed} setCompleted={setCompleted}/>}
                                </Grid>
                            </Grid>
                        </Box>
                    )


                }

                { (!apiSet) && (
                    (<AlertDialog
                        title={"Connecting to Metamask"}
                        description={"Approve the connection to your wallet"}
                        loading={!walletLoaded}
                        success={verified}
                        
                    />)
                )}

                { (apiSet && !approveSharing) && (
                    (<AlertDialog
                        title={"Share your Nokian Credential"}
                        description={"Waiting for your approval to query your nokian credential"}
                        loading={!walletLoaded}
                        success={verified}
                        
                    />)
                )}

                { (apiSet && approveSharing && hasNokian && !approveCreate) && (
                    (<AlertDialog
                        title={"Create your Presentation"}
                        description={"Waiting for your approval to create your presentation"}
                        loading={true}
                        success={verified}
                        
                    />)
                )}

                {(activeStep === 0) && alertOpen && (<Box position="fixed" bottom="10px" right="10px">
                    <Alert severity="info" onClose={handleCloseAlert} open={alertOpen} sx={{ 
                    width: "300px", 
                    minHeight: "100px", 
                }}>
                        <AlertTitle>Instructions</AlertTitle>
                        Welcome! Select your Meeting Date and Time by clicking on the calendar and dragging.
                    </Alert>
                </Box>)
                }

                
                { apiSet && !hasNokian && (

                        (<>
                            {
                                !redirected ?  (<AlertDialog
                                    title={"Credential from Nokian Issuer"}
                                    description={"Hold on we are checking if you have a nokian credential, in order to access the application we need you to present your Nokian Credential - proof of being a Nokia Employee. If you don't have one so you will need to get the Nokian verifiable credential, click on agree to be directed. Once issued return to this page and refresh the page."}
                                    loading={false}
                                    success={false}
                                    hidden={true}
                                    
                                />) : (<AlertDialog
                                    title={"Load your credential into Masca"}
                                    description={"You need to head to masca at https://masca.io/app share your credential and load it into your wallet"}
                                    loading={false}
                                    success={false}
                                    hidden={true}
                                    
                                />)
                            }

                        </>)
                )
                }

                {/* { (apiSet && approveSharing && approveCreate && hasNokian) && (
                                            <AlertDialog
                                                title={"Requesting for a Nokian"}
                                                description={`Access can only be given to those who are Nokian - approve the request on metamask`}
                                                loading={!walletLoaded}
                                                success={verified}
                                            /> 
                )} */}

            </Box>
        </Box>
    );
};

export default CreateMeeting;