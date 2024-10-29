import {useEffect,useState} from 'react';
import { Box, Typography, useTheme, Link} from '@mui/material';
import { DataGrid,GridToolbar } from '@mui/x-data-grid';
import { tokens } from '../../theme';

import Header from '../../components/Header';
import { teal,cyan } from '@mui/material/colors';

const JoinMeeting = ({api,did}) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);

    // Function to calculate the status of the meeting
    const calculateStatus = (startTime, endTime) => {
        const currentTime = Date.now();
        startTime = new Date(startTime).getTime();
        endTime = new Date(endTime).getTime();

        if (currentTime < startTime) {
            return 'Upcoming';
        } else if (currentTime >= startTime && currentTime <= endTime) {
            return 'Ongoing';
        } else {
            return 'Expired';
        }
    };

    const columns = [
        { field: 'id', headerName: 'ID' },
        { field: 'organizer', headerName: 'Organizer', flex: 1 },
        { field: 'start_time', headerName: 'Start Time', flex: 1 },
        { field: 'end_time', headerName: 'End Time', flex: 1 },
        { field: 'duration', headerName: 'Duration (mins)', flex: 1 },
        {
            field: 'url',
            headerName: 'URL',
            flex: 1,
            cellClassName: 'name-column--cell',
            renderCell: params => (
                <Typography
                    color={calculateStatus(params.row.start_time, params.row.end_time) === 'Ongoing' ||  calculateStatus(params.row.start_time, params.row.end_time) === 'Upcoming' ? teal[600] : 'textSecondary'}
                    component={Link}
                    href={calculateStatus(params.row.start_time, params.row.end_time) === 'Ongoing' ||  calculateStatus(params.row.start_time, params.row.end_time) === 'Upcoming' ? params.row.url : null}
                    underline="none"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Meeting Link
                </Typography>
            ),
        },
        { field: 'status', headerName: 'Active', flex: 1, valueGetter: params => calculateStatus(params.row.start_time, params.row.end_time) },
    ];

    useEffect(() => {
        const allDataEntry = localStorage.getItem("mymeetingsdata");
        const allData = JSON.parse(allDataEntry);
    },[api,did]);
    return (
        <Box m="20px">
            <Box alignContent="center" alignItems="center" justifyContent="center" display="flex">
                        <Typography variant="h1" fontWeight="bold" mt="80px" gutterBottom gridColumn={"span 4"}>
                            Meeting History
                        </Typography>
                    </Box>
            <Box
                m="5px 0 0 0"
                height="60vh"
                sx={{
                    "& .MuiDataGrid-root": {
                        // border:"none"
                    },
                    "& .MuiDataGrid-cell": {
                        // borderBottom:"none"
                        
                    },
                    "& .name-column--cell": {
                        color:cyan[600]
                    },
                    "& .MuiDataGrid-columnHeaders": {
                        backgroundColor: cyan[500],
                        fontWeight: 'bold'
                        // borderBottom: "none"
                    },
                    "& .MuiDataGrid-virtualScroller": {
                        backgroundColor: colors.grey[1000],
                    },
                    "& .MuiDataGrid-footerContainer": {
                        borderBottom: "true",
                        backgroundColor: cyan[500]
                        // backgroundColor: blue[700],
                    },
                    "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
                        color: `${colors.primary[500]} !important`,
                    },
    
    
            
                }}
            >

                <DataGrid components={{Toolbar: GridToolbar }} rows={Object.values(JSON.parse(localStorage.getItem("mymeetingsdata")))} columns={columns} />
            </Box>
        </Box>
    );
};

export default JoinMeeting;
