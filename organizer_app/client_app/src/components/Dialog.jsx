import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import CircularIntegration from "./Progress"
import { Typography,useTheme} from "@mui/material";
import { ColorModeContext,tokens } from "../theme";
import { blue } from '@mui/material/colors';
const AlertDialog = ({title,description,loading,success,hidden=false}) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const [open,setOpen] = React.useState(true);

    const handleClose = () => {
        if (success){
            setOpen(false);
        }
    };

    const handleRedirect = () => {
        
        // Store the redirect status in session storage
        localStorage.setItem('redirected', 'true');
        // Redirect user to the issuer
        window.open("https://sdsr-ssi.fp.cloud.bell-labs.com/issuer/nokia", "_blank");
    };

  return (
    <React.Fragment>
      
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">

        <Typography variant="h2" color={colors.grey[300]} fontWeight="bold" >{title}</Typography>

          
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            <Typography variant="h4" color={blue[800]} fontWeight="500" >{description}</Typography>
            <CircularIntegration loading={loading} success={success} hidden={hidden}/>
          </DialogContentText>
          
        </DialogContent>
        {hidden && (
                <DialogActions>
                    <Button onClick={handleRedirect}>
                        <Typography variant="h3" color={blue[800]} fontWeight="bold">Agree</Typography>
                    </Button>
                </DialogActions>
            )
        }
      </Dialog>
    </React.Fragment>
  );
}

export default AlertDialog;