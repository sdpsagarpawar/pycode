import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import { formatDate } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from "@fullcalendar/interaction";
import { v4 as uuidv4 } from 'uuid';
import { teal,cyan } from '@mui/material/colors';
import {
    Alert,
    AlertTitle,
    Box,
    List,
    ListItem,
    ListItemText,
    Typography,
    useTheme
} from "@mui/material";
import Header from "../components/Header";
import { tokens } from "../theme";
import { blue } from "@mui/material/colors";


function isValidDateTime(startDateTime, endDateTime) {
    const currentDateTime = new Date(); // Get the current date/time

    // Convert startDateTime and endDateTime to Date objects
    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);

    console.log(startDate,endDate,currentDateTime)

    // Check if the startDateTime is before the currentDateTime and endDateTime is after the currentDateTime
    return startDate >= currentDateTime
}



const Calendar = ({currentEvents,setCurrentEvents,activeStep=null,setActiveStep=null,completed=null,setCompleted=null}) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    
    const eventsData = JSON.parse(localStorage.getItem('allevents'));
    const eventDataArray = Object.values(eventsData);
    const [alertOpen, setAlertOpen] = useState(false);
    const [errormessage,setErrorMessage]= useState("");
    const [error_,setError] = useState(false);
    const [success_,setSuccess] = useState(false);
    const [successmessage,setSuccessMessage]= useState("");
    const handleCloseAlert = () => {
        setAlertOpen(false);
      };

    const handleDateClick = (selected) => {
       
        const title = prompt("Please enter a new title for your event");
        const CalendarApi = selected.view.calendar;
        CalendarApi.unselect();

        
        if (title){

            
            const event_ = {
                id: `${uuidv4()}`,
                title:title,
                start: selected.startStr,
                end:selected.endStr,
                start_time: selected.startStr,
                end_time: selected.endStr,
                allDay:false
            };

            const eventvalid = isValidDateTime(selected.startStr, selected.endStr);

            console.log(eventvalid);

            if (eventvalid){
                const newEvent = CalendarApi.addEvent(event_);
                const alleventsfromsession = JSON.parse(localStorage.getItem('allevents'));
                const numberOfEvents = Object.keys(alleventsfromsession).length;
                const nextEventKey = "event" + (numberOfEvents + 1);
                alleventsfromsession[nextEventKey] = event_;

                localStorage.setItem('allevents',JSON.stringify(alleventsfromsession));
                sessionStorage.setItem('new_meeting_id',event_.id);
                sessionStorage.setItem('save_meeting',false);
                sessionStorage.setItem('issuing_done',false);
                // CalendarApi.fullCalendar('renderEvent', event_, {stick:true});
                const newEventList = currentEvents;
                newEventList.push(newEvent);
                setCurrentEvents(newEventList);
        
                setActiveStep(activeStep + 1);
                const new_complete = completed;
                new_complete[activeStep] = true;
                setAlertOpen(true);
                setSuccess(true)
                setSuccessMessage(
                    "Successfully, added event"
                );
                setTimeout(()=>{setAlertOpen(false)},5000);
                setCompleted(completed);
            } else {
                setErrorMessage("Invalid event timings, please pick valid timings")
                setAlertOpen(true);
                setError(true);

                setTimeout(()=>{setAlertOpen(false)},5000);
            }
            
        }
    }

    const handleEventClick = (selected) => {
        if (window.confirm(`Are you sure you want to delete the event ${selected.event.title}`)){
            const selectedEventId = selected.event.id;
            const jsonObject = JSON.parse(localStorage.getItem('allevents'))

            for (const key in jsonObject) {
                const eventPair = jsonObject[key];
                if (eventPair.id === selectedEventId) {
                    delete jsonObject[key];
                    break; // Assuming there's only one occurrence of the value
                }
            }
            localStorage.setItem('allevents',JSON.stringify(jsonObject));
            selected.event.remove();
        };
    }

    return (
    

    <Box display="flex" justifyContent="space-between">
        {/* CALENDAR SIDEBAR */}
        <Box flex="1 1 20%" background={colors.primary[400]} p="15px" borderRadius="4px"> 
        {/* // grow, shrink and width */}
        <Typography  variant="h5">Events</Typography>
        <List>
            {currentEvents.map((event)=>(
                <ListItem 
                    key={event.id}
                    sx={{backgroundColor:cyan[500],margin: "10px 0",borderRadius:"2px"}}
                >

                <ListItemText
                    disableTypography
                    primary={<Typography style={{ color: '#FFFFFF', fontWeight:'bold' }}>{event.title}</Typography>}
                    secondary={<Typography style={{ color: '#FFFFFF' }}>{formatDate(event.start,{
                        year:"numeric",
                        month:"short",
                        day:"numeric",
                        hour:"numeric"
                    })}</Typography>}
                    // primary={event.title}
                    // sx={{color:colors.grey[500]}}

                />

            
                </ListItem>
            ))}
        </List>
        </Box>

        {/* CALENDAR */}

        <Box flex="1 1 100%" ml="15px">
            <FullCalendar 
                height="65vh"
                eventColor= {cyan[500]}
                plugins={[
                    dayGridPlugin,
                    timeGridPlugin,
                    interactionPlugin,
                    listPlugin
                ]}
                headerToolbar={{
                    left:"prev,next today",
                    center: "title",
                    right:"timeGridWeek,timeGridDay,dayGridMonth,listMonth"
                }}
                initialView="timeGridWeek"
                editable={true}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                select={handleDateClick}
                eventClick={handleEventClick}
                eventsSet={(events)=> setCurrentEvents(events)}
                initialEvents={eventDataArray}
            />
        </Box>
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
        
    
    )
}

export default Calendar;