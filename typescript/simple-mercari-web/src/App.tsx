import { useState } from 'react';
import './App.css';
import { ItemList } from './components/ItemList';
import {
  Link
} from "react-router-dom";
import Login from './components/Login/Login';
import { setToken, setUserId, getUserId, getToken } from './components/Login/Auth'


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
            <Link className='menu-button' to="/auction">Auction</Link>	
          </div>
      </header>
      <div>
        <ItemList reload={reload} onLoadCompleted={() => setReload(false)} />
      </div>
    </div>
  )
}

export default App;