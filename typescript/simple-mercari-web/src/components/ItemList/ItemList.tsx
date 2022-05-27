import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';

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

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
  },
};

export const ItemList: React.FC<Prop> = (props) => {
  let subtitle: HTMLHeadingElement| null;
  const [modalIsOpen, setIsOpen] = React.useState(false);

  function openModal() {
    setIsOpen(true);
  }

  function afterOpenModal() {
    // references are now sync'd and can be accessed.
    if (!subtitle) return
    subtitle.style.color = '#f00';
  }

  function closeModal() {
    setIsOpen(false);
  }
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
              <button type='submit' onClick={openModal}>Bid</button><button type='submit'>Buy Now</button>
            </p>
          </div>
        )
      })}
      <Modal
        isOpen={modalIsOpen}
        onAfterOpen={afterOpenModal}
        onRequestClose={closeModal}
        style={customStyles}
        contentLabel="Example Modal"
      >
        <h2 ref={(_subtitle) => (subtitle = _subtitle)}>Create Bid</h2>
        <div>Enter bid amount</div>
        <input type='text' required />
        <button type='submit'>Make a bid</button>
        <button type='submit' onClick={closeModal}>close</button>
      </Modal>
    </div>
  )
};
