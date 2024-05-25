// Here we are using "Mini variant drawer" to create a side navigation bar:

import React, { useEffect, useState } from 'react'
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
import { Avatar, Popover, Tooltip } from '@mui/material';

import HomeIcon from '@mui/icons-material/Home';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import EditNoteIcon from '@mui/icons-material/EditNote';
import CalendarMonthSharpIcon from '@mui/icons-material/CalendarMonthSharp';
import ArticleIcon from '@mui/icons-material/Article';
import SettingsIcon from '@mui/icons-material/Settings';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import KitchenIcon from '@mui/icons-material/Kitchen';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import axios from 'axios';

import RobotoBoldFont from '../fonts/Roboto-Bold.ttf'
import UserProfile from '../LoginRegister/UserProfile';

import { serverBaseAddress } from '../Pages/APIPage';



const styles = {
  '@font-face': {
    fontFamily: 'Roboto-Bold',
    src: `url(${RobotoBoldFont}) format('truetype')`,
  },
};


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


  //States and functions to handle the onclick events on Avatar:
  const [anchorEl, setAnchorEl] = useState(null)

  const handleClickAvatar = (event) => {
    setAnchorEl(event.currentTarget);
  }

  const handleCloseAvatar = () => {
    setAnchorEl(null);
  }

  const isOpenUserProfileWindow = Boolean(anchorEl)
  const userProfileWindowId = isOpenUserProfileWindow ? 'user-profile-window-popover' : undefined;


  // To highlight the selected or clicked buton 
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleListItemClick = (event, index) => {
    setSelectedIndex(index);
  };


  const navigate = useNavigate()

  // State variable to set the user name:
  const [loggedInUser, setLoggedInUser] = useState('')

  // State variable to get the logged in user role
  const [loggedInUserRole, setLoggedInUserRole] = useState('')

  // State variable to get the logged in user department
  const [loggedInUserDepartment, setLoggedInUserDepartment] = useState('')

  // To validate the user credential its very much important
  axios.defaults.withCredentials = true;

  // To get the logged in user name:
  useEffect(() => {
    axios.get(`${serverBaseAddress}/api/getLoggedInUser`)
      .then(res => {
        if (res.data.valid) {
          //console.log(res.data.user_role)
          setLoggedInUserRole(res.data.user_role)
          setLoggedInUser(res.data.user_name)
          setLoggedInUserDepartment(res.data.user_department)
        } else {
          navigate("/")
        }
      })
      .catch(err => console.log(err))
  }, [])


  // Create avatar texts to display in the sidebar
  const firstLetter = loggedInUser.charAt(0).toUpperCase();
  const userAvatar = firstLetter


  // Create items to display in the side navigation bar
  const items = [
    { i: 1, label: 'Home', icon: <HomeIcon />, path: '/home' },
    { i: 2, label: 'Quotation Dashboard', icon: <SpaceDashboardIcon />, path: '/quotation_dashboard' },
    { i: 3, label: 'Add Quotation', icon: <RequestQuoteIcon />, path: '/quotation' },
    { i: 4, label: 'Quotation Essentials', icon: <NoteAddIcon />, path: '/quotation_essentials' },
    { i: 5, label: 'JC Dashboard', icon: <SpaceDashboardIcon />, path: '/jobcard_dashboard' },
    { i: 6, label: 'Jobcard', icon: <ArticleIcon />, path: '/jobcard' },
    { i: 7, label: 'Jobcard Essentials', icon: <NoteAddIcon />, path: '/jobcard_essentials' },
    { i: 8, label: 'Slot Booking', icon: <CalendarMonthSharpIcon />, path: '/slot_booking' },
    { i: 9, label: 'Chamber & Calibration', icon: <KitchenIcon />, path: '/chamber-calibration' },
    { i: 10, label: 'User Management', icon: <ManageAccountsIcon />, path: '/user_management' },
  ]

 

  // Filter items based on the user's role
  const filteredItems = items.filter(item => {
    if (loggedInUserDepartment === 'All') {
      return true; // Show all items for Admin

    } else if (loggedInUserDepartment === 'Marketing') {
      return [2, 3, 4, 10].includes(item.i); // Show items 1, 2, 3, and 9 for Marketing

    } else if (loggedInUserDepartment === 'Testing') {
      return [5, 6, 7, 8, 9].includes(item.i);

    } else if (loggedInUserDepartment === 'Reliability') {
      return [5, 6, 7].includes(item.i);
    }
    return false; // Default: Hide the item
  });



  const [leftmargin, setLeftMargin] = useState(70)


  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleMenuToggle = () => {
    setOpen(!open);
    setLeftMargin(open ? 70 : 200);
  };



  function MenuItem({ item, index }) {

    return (
      <Tooltip title={item.label} placement="right" arrow>
        <ListItem disablePadding sx={{ display: 'block' }}
          as={Link} to={item.path}
        >
          <ListItemButton
            selected={selectedIndex === index} onClick={(event) => handleListItemClick(event, index)}
            sx={{ display: 'flex', alignItems: 'center', minHeight: 48, justifyContent: open ? 'initial' : 'center', px: 2.5, }}
          >
            <ListItemIcon sx={{ minWidth: 0, mr: open ? 3 : 'auto', justifyContent: 'center', }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              // primary={item.label}
              primary={<span style={{ fontFamily: 'Roboto-Bold', fontSize: '14px', fontWeight: 'bold' }}>{item.label}</span>}
              sx={{ opacity: open ? 1 : 0, color: 'black' }} />
          </ListItemButton>
        </ListItem>
      </Tooltip>
    )
  }

  return (
    <>
      <Box sx={{ paddingLeft: `${leftmargin}px`, transition: '0.2s ease-in-out' }}>
        {/* <Box> */}
        <CssBaseline />

        {/* To cutomize the top header or the app bar */}
        <AppBar position="fixed" elevation={4} sx={{ backgroundColor: "#0D809D", color: "#2f2f2f", height: "64px" }}>
          <Toolbar  >
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleMenuToggle}
              edge="start"
            >
              <MenuIcon />
            </IconButton>

            <Typography variant="h6" noWrap component="div" >
              Lab Bee
            </Typography>

            {/* Add the box with flexGrow which will acts as a spacer item */}
            <Box sx={{ flexGrow: 1 }} />

            <IconButton
              onClick={handleClickAvatar}
            >
              <Avatar sx={{ backgroundColor: '#ff3333' }}>
                {userAvatar}
              </Avatar>
            </IconButton>

            <Popover
              id={userProfileWindowId}
              open={isOpenUserProfileWindow}
              anchorEl={anchorEl}
              onClose={handleCloseAvatar}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'center',
              }}
            >
              <UserProfile
                userAvatar={userAvatar}
                userName={loggedInUser}
              />
            </Popover>

          </Toolbar>
        </AppBar>

        <Drawer variant="permanent" open={open} >
          <DrawerHeader>
            <IconButton onClick={handleDrawerClose}>
              {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          </DrawerHeader>

          {/* Create a list and add the number of items in order show it in a sidebar */}
          {filteredItems.map(item => (
            // Render your item component here
            (<MenuItem key={item.i} item={item} index={item.i} />)
          ))}


        </Drawer>

        <Box component="main" sx={{ flexGrow: 1, padding: 3, }}>
          <Box height={100} sx={{ marginTop: '1', marginBottom: '0.5', marginRight: '1', paddingTop: '5' }} />
          <Outlet />
        </Box>
      </Box>
    </>
  );
};



 // // Filter items based on the user's role
  // const filteredItems = items.filter(item => {
  //   if (loggedInUserRole === 'Admin') {
  //     return true; // Show all items for Admin

  //   } else if (loggedInUserRole === 'Marketing') {
  //     return [2, 3, 4, 10, 11, 12].includes(item.i); // Show items 1, 2, 3, and 9 for Marketing

  //   } else if (loggedInUserRole === 'Lab Manager' || loggedInUserRole === 'Lab Engineer' || loggedInUserRole === 'Lab Technician') {
  //     return [5, 6, 7, 8, 9, 11, 12].includes(item.i); // Show items 4, 5, and 9 for Lab Manager 

  //   }
  //   return false; // Default: Hide the item
  // });
