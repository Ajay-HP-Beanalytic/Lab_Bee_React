import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import Loader from './common/Loader';
import { BrowserRouter } from 'react-router-dom';
import { UserProvider } from './Pages/UserContext';


{/*Original code was this*/ }

// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );





{/*updated code with the loader*/ }
// const AppWithLoader = () => {
//   return (
//     <>
//       <BrowserRouter>
//         <React.StrictMode>
//           <Loader />
//           <App />
//         </React.StrictMode>
//       </BrowserRouter>
//     </>
//   )
// }

const AppWithLoader = () => {
  return (
    <>
      <BrowserRouter>
        <React.StrictMode>
          <UserProvider>
            <Loader />
            <App />
          </UserProvider>
        </React.StrictMode>
      </BrowserRouter>
    </>
  )
}

// Render the AppWithLoader component
const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(<AppWithLoader />)


{/* This part is common*/ }
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
