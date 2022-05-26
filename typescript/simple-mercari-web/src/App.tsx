import { useState } from 'react';
import './App.css';
import { ItemList } from './components/ItemList';
import { Listing } from './components/Listing';
import {
  Link
} from "react-router-dom";

function App() {
  // reload ItemList after Listing complete
  const [reload, setReload] = useState(true);
  return (
    <div>
      <header className='Title'>
        <p><Link to="/">Listing</Link> | <Link to="/auction">Auction</Link></p>
      </header>
      <div>
        <Listing onListingCompleted={() => setReload(true)} />
      </div>
      <div>
        <ItemList reload={reload} onLoadCompleted={() => setReload(false)} />
      </div>
    </div>
  )
}

export default App;