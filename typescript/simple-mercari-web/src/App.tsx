import { useState } from 'react';
import './App.css';
import { ItemList } from './components/ItemList';
import {
  Link
} from "react-router-dom";
import Login from './components/Login/Login';

function setToken(userToken: any) {
	sessionStorage.setItem('access_token', JSON.stringify(userToken));
}

function setUserId(userId: any) {
	sessionStorage.setItem('id', JSON.stringify(userId));
}

function getUserId() {
	const userIdString = sessionStorage.getItem('id');
	if (!userIdString)
		return "";
	const userId = JSON.parse(userIdString);
	return userId?.id
}


function getToken() {
	const tokenString = sessionStorage.getItem('access_token');
	if (!tokenString)
		return "";
	const userToken = JSON.parse(tokenString);
	return userToken?.access_token
}

function App() {
  // reload ItemList after Listing complete
  const [reload, setReload] = useState(true);
  const token = getToken();

  if(!token) {
	  return (
		<>
			<Login setToken={setToken} setUserId={setUserId} />
			<Link to="/register" className='menu-button'>Register</Link>
		</>
	  )
	}
  
  return (
    <div>
      <header className='Title'>
          <div className='desktop-container'>
            <a className='menu-item' href="/">Items</a>
            <a className='menu-item' href="/listing">Listing</a>
            <Link className='menu-button' to="/auction" state={getUserId()}>Auction</Link>	
          </div>
      </header>
      <div>
        <ItemList reload={reload} onLoadCompleted={() => setReload(false)} />
      </div>
    </div>
  )
}

export default App;