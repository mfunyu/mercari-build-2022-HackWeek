import React, { useEffect, useState } from 'react';

interface Item {
  id: number;
  name: string;
  category: string;
  image: string;
  price: string;
};

const server = process.env.API_URL || 'http://127.0.0.1:9000';
const placeholderImage = process.env.PUBLIC_URL + '/logo192.png';

interface Prop {
  reload?: boolean;
  onLoadCompleted?: () => void;
}

export const ItemList: React.FC<Prop> = (props) => {
  const { reload = true, onLoadCompleted } = props;
  const [items, setItems] = useState<Item[]>([])
  const fetchItems = () => {
    fetch(server.concat('/items'),
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
        setItems(data.items);
        onLoadCompleted && onLoadCompleted();
      })
      .catch(error => {
        console.error('GET error:', error)
      })
  }

  useEffect(() => {
    if (reload) {
      fetchItems();
    }
  }, [reload]);

  return (
    <div className='wrapper' >
      {items.map((item) => {
        return (
          <div key={item.id} className='ItemList'>
            {/* TODO: Task 1: Replace the placeholder image with the item image */}
            <img src= {`${server}/image/${item.image}`} className='image' alt='not available'/>
            <p>
              <span className="item_label">Name:</span> {item.name}
              <br />
              <span className="item_label">Category:</span> {item.category}
              <br />
              <span className="item_label">Price:</span> {item.price}
            </p>
            <p>
              <button>Bid</button> | <button>Buy Now</button>
            </p>
          </div>
        )
      })}
    </div>
  )
};
