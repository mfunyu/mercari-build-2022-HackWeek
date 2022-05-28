import React, { useState, useEffect } from 'react';
import './Listing.css'
import { Link } from "react-router-dom"

const server = process.env.API_URL || 'http://127.0.0.1:9000';

interface Prop {
  onListingCompleted?: () => void;
}

type formDataType = {
  name: string,
  category: string,
  image: string | File,
  price: string,
  auction: string
}

type Category = {
  id: number,
  name: string,
}

export default function Listing() {
  const initialState = {
    name: "",
    category: "",
    image: "",
    price: "",
    auction: "",
  };
  const [values, setValues] = useState<formDataType>(initialState);
  const [checked, setChecked] = React.useState(false);
  const [categories, setCategories] = useState<Category[]>([])

  const handleChange = () => {
    setChecked(!checked);
  };

  // Categories
  const fetchCategories = () => {
    fetch(server.concat('/categories'),    //fetch API
      {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      })
      .then(response => response.json())
      .then(data => {
        console.log('GET success:', data);
        setCategories(data.items);
      })
      .catch(error => {
        console.error('GET error:', error)
      })
  }

  useEffect(() => {
      // Get Categories list on first render
      fetchCategories();
  }, []);


  const onValueChange = (event: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement>) => {
    setValues({
      ...values, [event.target.name]: event.target.value,
    })
  };
  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues({
      ...values, [event.target.name]: event.target.files![0],
    })
  };
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData()
    data.append('name', values.name)
    data.append('category', values.category)
    data.append('image', values.image)
    data.append('price', values.price)
    const isAuction = checked ? 1 : 0
    data.append('is_auction', isAuction.toString())

    fetch(server.concat('/items'), {
      method: 'POST',
      mode: 'cors',
      body: data,
    })
      .then(response => {
        console.log('POST status:', response.statusText);
      })
      .catch((error) => {
        console.error('POST error:', error);
      })
  };
  return (
    <div>
    <header className='Title'>
        <p><Link to="/">Items</Link> | <Link to="/listing">Listing</Link> | <Link to="/auction">Auction</Link></p>
    </header>
	<div className='Content'>
    <div className='Listing'>
      <form onSubmit={onSubmit}>
        <div className="form">
            <input type='text' name='name' id='name' placeholder='Name' onChange={onValueChange} required />
            <select name="category" id="category" onChange={onValueChange} required >
              <option value="" disabled selected>Select a category...</option>
              {categories.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
            </select>
            <input type='text' name='price' id='price' placeholder='Price' onChange={onValueChange} required />
            <Checkbox label="Allow Auction"
            value={checked}
            onChange={handleChange}
            />
          <label className="upload">Upload an image
            <input type='file' name='image' id='image' onChange={onFileChange} required />
          </label>
          <button type='submit'>List this item</button>
        </div>
      </form>
    </div>
    </div>
	</div>
  );
}

// @ts-ignore
const Checkbox = ({label, value, onChange}) => {
  return (
    <label>
      <input type="checkbox" checked={value} onChange={onChange} />
      {label}
    </label>
  );
};