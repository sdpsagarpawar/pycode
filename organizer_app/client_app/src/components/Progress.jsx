import * as React from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { Typography, useTheme } from "@mui/material";
import { ColorModeContext, tokens } from "../theme";
import { blue } from '@mui/material/colors';

const CircularIntegration = ({ loading, success, hidden }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100px', minWidth: '100px' }}>
            {loading && (
                <CircularProgress size={68} sx={{ color:blue[800] }}/>
            )}
        </Box>
    );
}

export default CircularIntegration;
