import './App.css';
import { ColorModeContext,useMode } from "./theme";
import { CssBaseline,ThemeProvider } from "@mui/material";
import Topbar from "./scenes/global/TopBar";
import Sidebar from "./scenes/global/SideBar";
import CreateMeeting from "./scenes/creatingmeeting";
import JoinMeeting from "./scenes/joinmeeting"
import GiveCredential from "./scenes/getcredential";
import AlertDialog from './components/Dialog';
import EmbeddedLink from './components/EmbeddedLink';
import { useState,useEffect } from 'react';
import {enableMasca,isError} from '@blockchain-lab-um/masca-connector'
import { Routes,Route } from "react-router-dom";
import Alert from '@mui/material/Alert';
import { Calendar } from '@fullcalendar/core';
import { v4 as uuidv4 } from 'uuid';
import detectEthereumProvider from '@metamask/detect-provider';



function App() {
  const [theme,colorMode] = useMode();
  const [api, setApi] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [provider, setProvider] = useState(null);
  const [did, setDid] = useState('');
  const [alert, setAlert] = useState(false);
  const [alertContent, setAlertContent] = useState('');
  const [currentEvents,setCurrentEvents] = useState([]);
  
  const [missingMetamask, setMissingMetamask] = useState(false);
  
  const connectOrReloadAndConnect = async () => {
    try {
      const accounts_ = await provider.request({ method: "eth_requestAccounts" });
      setAccounts(accounts_);
    } catch (error) {
      const message = error.message || "";
      if (!message.match(/already processing/i)) { 
        
          console.error(error.message);
          setAlertContent("Something went wrong: " + error.message);
          setAlert(true);
          setMissingMetamask(true);
       }
  
      const href = window.location.href;
      if (href.match(/connectOnLoad/)) { window.location.reload(); return; }
  
      const delimiter = href.match(/\?/) ? "&" : "?";
      window.location.href += delimiter + "connectOnLoad=true";
    }
  };
  
  useEffect(() => {
    const connectMetamask = async () => {
      try {
        const accounts_ = await window.ethereum.request({ method: "eth_requestAccounts" });
        
        if (accounts_.length === 0) {
          console.log("No metamask accounts!");
          setMissingMetamask(true);
        } else {
          console.log(accounts_);
          setAccounts(accounts_);
        }
      } catch (error) {
        // Handle errors here
        console.error("Error while connecting Metamask:", error);
      }
    };

    connectMetamask(); // Initial attempt to connect

  }, []);
  useEffect(()=>{
    const assureMasca = async () => {
      try {

        const address = accounts[0];
        console.log(address);
        const enableResult = await enableMasca(address,
          { snapId: 'npm:@blockchain-lab-um/masca',
          version: '1.2.2',
          supportedMethods: ['did:key'] }
        );
        console.log(enableResult)
        if (isError(enableResult)) {
          throw new Error(enableResult.message);
        }

        const mascaApi = await enableResult.data.getMascaApi();
        const getMethod = await mascaApi.getSelectedMethod();

        if (getMethod !== "did:key") {
          await mascaApi.switchDIDMethod('did:key');
          
        }

        const res_did = await mascaApi.getDID();
        
        
        setApi(mascaApi);
        setDid(res_did.data);
        setMissingMetamask(false);
      } catch (error) {
        console.error(error.message);
        setAlertContent("Something went wrong: " + error.message);
        setAlert(true);
        setMissingMetamask(true);
      }
    };

    

    assureMasca();
    const mymeetings = localStorage.getItem('mymeetingsdata')

    if (mymeetings===null){
      const id1 = `${uuidv4()}`;
      const id2 = `${uuidv4()}`;
      const id3 = `${uuidv4()}`;
      const meeting1 = `meeting-${id1}`;
      const meeting2 = `meeting-${id2}`;
      const meeting3 = `meeting-${id3}`;
      const mockDataMeetings = {
        meeting1 : { id: id1, organizer: "john.doe@nokia.com", start_time: "2024-03-25T09:00:00", end_time: "2024-03-25T10:00:00", duration: 60, url: "http://example.com/meeting1", status: "Expired" },
        meeting2: { id: id2, organizer: "jane.smith@nokia.com", start_time: "2024-03-25T10:00:00", end_time: "2024-03-25T11:00:00", duration: 60, url: "http://example.com/meeting2", status: "Expired" },
        meeting3 :{ id:id3, organizer: "alice.johnson@nokia.com", start_time: "2024-03-25T11:00:00", end_time: "2024-03-25T12:00:00", duration: 60, url: "http://example.com/meeting3", status: "Expired" },
      };
      localStorage.setItem('mymeetingsdata',JSON.stringify(mockDataMeetings));
    }

  },[accounts]);
  
  return (
  <ColorModeContext.Provider value={colorMode}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="app">
       
        <Sidebar />
        <main className="content">
          <Topbar did_query={did}/>
          <Routes>
            <Route path="/" element={<CreateMeeting api={api} did={did} currentEvents={currentEvents} setCurrentEvents={setCurrentEvents}/>} />
            {/* <Route path="/eventcalendar" element={<Calendar currentEvents={currentEvents} setCurrentEvents={setCurrentEvents} />} /> */}
            
            <Route path="/joinmeeting" element={<JoinMeeting api={api} did={did}/>} />
            <Route path="/getcredential" element={<GiveCredential api={api} did={did}/>} />
          </Routes>
          { (missingMetamask) && (
                                            <AlertDialog
                                            title={"Metamask Issue"}
                                            description={"Trying to reach metamask. It could be you have a pending request or you don't have metamask downloaded in that case go to https://metamask.io/download/. Once you complete pending transactions or download metamask, reload the page."}
                                            loading={false}
                                            success={false}
                                        />
                                        
                )}
        </main>
      </div>
    </ThemeProvider>
    
  </ColorModeContext.Provider>
    
  );
}

export default App;
