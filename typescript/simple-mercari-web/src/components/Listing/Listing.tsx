import React, { useState, useEffect } from 'react';

const server = process.env.API_URL || 'http://127.0.0.1:9000';

interface Prop {
  onListingCompleted?: () => void;
}

type formDataType = {
  name: string,
  category: string,
  image: string | File,
}

type Category = {
  id: number,
  name: string,
}

export const Listing: React.FC<Prop> = (props) => {
  const { onListingCompleted } = props;
  const initialState = {
    name: "",
    category: "",
    image: "",
  };
  const [values, setValues] = useState<formDataType>(initialState);
  const [categories, setCategories] = useState<Category[]>([])

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

    fetch(server.concat('/items'), {
      method: 'POST',
      mode: 'cors',
      body: data,
    })
      .then(response => {
        console.log('POST status:', response.statusText);
        onListingCompleted && onListingCompleted();
      })
      .catch((error) => {
        console.error('POST error:', error);
      })
  };
  return (
    <div className='Listing'>
      <form onSubmit={onSubmit}>
        <div className="form">
            <input type='text' name='name' id='name' placeholder='Name' onChange={onValueChange} required />
            <select name="category" id="category" onChange={onValueChange} required >
              <option value="" disabled selected>Select a category...</option>
              {categories.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
            </select>
          <label className="upload">Upload an image
            <input type='file' name='image' id='image' onChange={onFileChange} required />
          </label>
          <button type='submit'>List this item</button>
        </div>
      </form>
    </div>
  );
}
