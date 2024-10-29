import { Box, IconButton, useTheme, Chip, Typography } from "@mui/material";
import { useContext } from "react";
import { ColorModeContext, tokens } from "../../theme";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";

const Topbar = ({ did_query }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);

  return (
    <Box
      display="flex"
      justifyContent="space-between" // To spread items apart
      alignItems="center" // To center vertically
      position="fixed"
      top="0"
      left="0"
      right="0"
      height="64px" // Assuming a height for the top bar
      paddingX="8px" // Adjust padding as needed
      backgroundColor="#2196f3" // Background color for the top bar
      color="#fff" // Text color for the top bar
      zIndex="9999" // Ensure it's above other content
    >
      {/* Typography */}
      <Typography variant="h2">SSI Meeting Organizer</Typography>

      {/* Box for Chip and IconButton */}
      <Box display="flex" alignItems="center">
        {/* Chip */}
        <Chip label={"DID: " + did_query} style={{ backgroundColor: '#1976d2', color: '#fff' }} />

        {/* Icons */}
        <IconButton onClick={colorMode.toggleColorMode}>
          {theme.palette.mode === 'dark' ? (
            <DarkModeOutlinedIcon />
          ) : (
            <LightModeOutlinedIcon />
          )}
        </IconButton>
      </Box>
    </Box>
  );
}

export default Topbar;
