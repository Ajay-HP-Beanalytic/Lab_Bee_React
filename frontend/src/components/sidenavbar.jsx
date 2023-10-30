// Here we are using "Mini variant drawer" to create a side navigation bar:

import React, { useState } from 'react'
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { Avatar, Tooltip } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import EditNoteIcon from '@mui/icons-material/EditNote';
import CalendarMonthSharpIcon from '@mui/icons-material/CalendarMonthSharp';
import ArticleIcon from '@mui/icons-material/Article';
import SettingsIcon from '@mui/icons-material/Settings';
import { Link, Outlet } from 'react-router-dom';




const drawerWidth = 200;

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
);

export default function SidenavigationBar() {

  const theme = useTheme();
  const [open, setOpen] = useState(false);          // "true" to keep open, and "false" is for keep it closed
  const [menudata, setMenudata] = useState("Home");

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };


  // To highlight the selected or clicked buton 
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleListItemClick = (event, index) => {
    setSelectedIndex(index);
  };


  {/*//const { loggedInUser } = useContext(AuthContext);*/ }

  const loggedInUser = 'Ajay kumar HP'
  const firstLetter = loggedInUser.charAt(0).toUpperCase();
  //const secondLetter = loggedInUser.charAt(5).toUpperCase();

  //const userAvatar = firstLetter + secondLetter

  const userAvatar = firstLetter




  return (
    <>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />

        {/* To customize the top header or the app bar */}
        <AppBar position="fixed" elevation={4} sx={{ backgroundColor: "#0D809D", color: "#2f2f2f", height: "64px" }}>
          <Toolbar >
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={() => { setOpen(!open) }}
              edge="start"
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              {/*<img src="./LabBee_Icon.png" height={25} alignItems="center" />*/}
              Lab Bee
            </Typography>
          </Toolbar>
        </AppBar>


        <Drawer variant="permanent" open={open} >
          <DrawerHeader>
            <IconButton onClick={handleDrawerClose}>
              {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          </DrawerHeader>


          {/* Create a list and add the number of items in order show it in a sidebar */}
          <List  >

            <Tooltip title='Home' placement="right" arrow>
              {/* Home List item */}
              <ListItem disablePadding sx={{ display: 'block' }}
                // onClick={() => setMenudata("Home")}
                as={Link} to='/'
              >
                <ListItemButton
                  selected={selectedIndex === 0} onClick={(event) => handleListItemClick(event, 0)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 3 : 'auto',
                      justifyContent: 'center',
                    }}>

                    <HomeIcon />
                  </ListItemIcon>
                  <ListItemText primary="Home" sx={{ opacity: open ? 1 : 0, fontFamily: 'Roboto' }} />
                </ListItemButton>
              </ListItem>
            </Tooltip>


            {/* Quotation item */}
            <Tooltip title='Quotation' placement="right" arrow>
              <ListItem disablePadding sx={{ display: 'block' }}
                // onClick={() => setMenudata("Quotation")}
                as={Link} to='/quotation'
              >
                <ListItemButton
                  selected={selectedIndex === 1} onClick={(event) => handleListItemClick(event, 1)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 3 : 'auto',
                      justifyContent: 'center',
                    }}>

                    <RequestQuoteIcon />
                  </ListItemIcon>
                  <ListItemText primary="Quotation" sx={{ opacity: open ? 1 : 0, fontFamily: 'Roboto' }} />
                </ListItemButton>
              </ListItem>
            </Tooltip>


            <Tooltip title='Update Quotation' placement="right" arrow>
              {/* Quotation update item */}
              <ListItem disablePadding sx={{ display: 'block' }}
                as={Link} to='/updateenviquote/Sample'
              // onClick={() => setMenudata("Update Quotation")}
              >
                {/* <ListItem disablePadding sx={{ display: 'block' }} onClick={() => setMenudata("/updateenviquote/:quotationID")}> */}
                <ListItemButton
                  selected={selectedIndex === 2} onClick={(event) => handleListItemClick(event, 2)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 3 : 'auto',
                      justifyContent: 'center',
                    }}>

                    <EditNoteIcon />
                  </ListItemIcon>
                  <ListItemText primary="Update Quotation" sx={{ opacity: open ? 1 : 0, fontFamily: 'Roboto' }} />
                </ListItemButton>
              </ListItem>
            </Tooltip>






            {/* Job card item */}
            <Tooltip title='Jobcard' placement="right" arrow>
              <ListItem disablePadding sx={{ display: 'block' }}
                as={Link} to='/jobcard'
              // onClick={() => setMenudata("Jobcard")}
              >
                <ListItemButton
                  selected={selectedIndex === 3} onClick={(event) => handleListItemClick(event, 3)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 3 : 'auto',
                      justifyContent: 'center',
                    }}>

                    <ArticleIcon />
                  </ListItemIcon>
                  <ListItemText primary="Job Card" sx={{ opacity: open ? 1 : 0, fontFamily: 'Roboto' }} />
                </ListItemButton>
              </ListItem>
            </Tooltip>

            {/* Slot Booking item */}
            <Tooltip title='Slot Booking' placement='right' arrow>
              <ListItem disablePadding sx={{ display: 'block' }}
                as={Link} to='/slot-booking'
              // onClick={() => setMenudata("Shorts")}
              >
                <ListItemButton
                  selected={selectedIndex === 4} onClick={(event) => handleListItemClick(event, 4)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 3 : 'auto',
                      justifyContent: 'center',
                    }} >
                    <CalendarMonthSharpIcon />
                  </ListItemIcon>
                  <ListItemText primary="Slot Booking" sx={{ opacity: open ? 1 : 0, fontFamily: 'Roboto' }} />
                </ListItemButton>
              </ListItem>
            </Tooltip>

          </List>


          <List sx={{ marginTop: 'auto' }} >

            <Tooltip title='Settings' placement='right' arrow>
              <ListItem disablePadding sx={{ display: 'block' }}
                as={Link} to='/settings'
              // onClick={() => setMenudata("Home")}
              >
                <ListItemButton
                  selected={selectedIndex === 5} onClick={(event) => handleListItemClick(event, 5)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 3 : 'auto',
                      justifyContent: 'center',
                    }}>

                    <SettingsIcon />
                  </ListItemIcon>
                  <ListItemText primary="Settings" sx={{ opacity: open ? 1 : 0, fontFamily: 'Roboto' }} />
                </ListItemButton>
              </ListItem>
            </Tooltip>


            <Tooltip title={loggedInUser} placement='right' arrow>
              {/* Logout user */}
              <ListItem disablePadding sx={{ display: 'block' }} onClick={() => setMenudata("User")}>
                <ListItemButton
                  selected={selectedIndex === 6} onClick={(event) => handleListItemClick(event, 6)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                  }}
                //onClick={() => openUserDialog()} // Open the dialog when clicking "User"
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 3 : 'auto',
                      justifyContent: 'center',
                    }}>

                    <Avatar sx={{ backgroundColor: 'primary.light' }}> {userAvatar} </Avatar>   {/*To show the name on hovering we can use title */}

                  </ListItemIcon>
                  <ListItemText primary={loggedInUser} sx={{ opacity: open ? 1 : 0, fontFamily: 'Roboto' }} />
                </ListItemButton>
              </ListItem>
            </Tooltip>
          </List>

        </Drawer>

        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Box height={100} sx={{ marginTop: '0.5', marginBottom: '0.5' }} />
          <Outlet />
          {/* {menudata === "Home" && <HomeDashboard />}
          {menudata === "Quotation" && <Quotations />}
          {menudata === "Update Quotation" && <UpdateQuotations />}
          {menudata === "Jobcard" && <Jobcard />}
          {menudata === "User" && <UserDetailsDialog />} */}
          {/* {menudata === "Update Quotation " && <UpdateEnvironmentalQuote />} */}
        </Box>
      </Box>
    </>
  );
};


