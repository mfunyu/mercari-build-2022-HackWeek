import { useState } from 'react';
import './App.css';
import { ItemList } from './components/ItemList';
import {
  Link
} from "react-router-dom";

function App() {
  // reload ItemList after Listing complete
  const [reload, setReload] = useState(true);
  return (
    <div>
      <header className='Title'>
          <div className='desktop-container'>
            <a className='menu-item' href="/">Items</a>
            <a className='menu-item' href="/listing">Listing</a>
            <a className='menu-button' href="/auction">Auction</a>	
          </div>
      </header>
      <div>
        <ItemList reload={reload} onLoadCompleted={() => setReload(false)} />
      </div>
    </div>
  )
}

export default App;