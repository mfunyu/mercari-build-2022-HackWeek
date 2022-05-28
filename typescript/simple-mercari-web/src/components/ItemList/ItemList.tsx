import React, { ReactElement, useEffect, useState } from 'react';
import Modal from 'react-modal';

interface Item {
  id: string;
  name: string;
  category: string;
  image: string;
  price: string;
  is_auction: number;
  on_sale: number;
};

interface Bid {
  id: string;
  bidder_name: string;
  items_id: string;
  bid_price: string;
  item_name: string;
};

type bidPrice = {
  price: string
}

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
  const { reload = true, onLoadCompleted } = props;
  let subtitle: HTMLHeadingElement| null;
  const [modalIsOpen, setIsOpen] = React.useState(false);
  const [selectedItemId, setSelectedItemId] = React.useState("")

  const initialState = {
    price: "",
  };
  const [values, setValues] = useState<bidPrice>(initialState);
  const onValueChange = (event: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement>) => {
    setValues(
      {price: event.target.value}
    )
  };

  const submitBid = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData()
    data.append('bid_price', values.price)
    fetch(server.concat(`/auction/${selectedItemId}`),
    {
      method: 'POST',
      mode: 'cors',
      body: data,
    }).then(response => {
      console.log('POST status:', response.statusText);
    }).then(() =>{
      fetchBids()
    }).catch((error) => {
      console.error('POST error:', error);
    })
    closeModal();
  }

  function openModal(): any {
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

  const [bids, setBids] = useState<Bid[]>([])
  const fetchBids = () => {
      fetch(server.concat('/auction'),
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
              setBids(data.items);
              onLoadCompleted && onLoadCompleted();
          })
          .catch(error => {
              console.error('GET error:', error)
          })
  }

  useEffect(() => {
    if (reload) {
      fetchItems();
      fetchBids();
    }
  }, [reload]);

  const EditBid = ({ id }: { id: string }) => {
    if(bids.filter((bid) => bid.items_id === id).length > 0) {
      return <button type='submit'>Edit Bid</button>
    } else {
      return <button type='submit' disabled>Edit Bid</button>
    }
  }

  const CreateBid = ({ id }: { id: string }) => {
    if(bids.filter((bid) => bid.items_id === id).length === 0) {
      return <button type='submit' onClick={() => {openModal(); setSelectedItemId(id);}}>Bid</button>
    } else {
      return <button type='submit' disabled>Bid</button>
    }
  }

  return (
    <div className='wrapper' >
      {items.map((item) => {
        return (
          <div key={item.id} className='ItemList'>
            <img src= {`${server}/image/${item.image}`} className='image' alt='not available'/>
            <p>
              <span className="item_label">Name:</span> {item.name}
              <br />
              <span className="item_label">Category:</span> {item.category}
              <br />
              <span className="item_label">Price:</span> {item.price}
            </p>
            <p>
              <CreateBid id={item.id} /><button type='submit'>Buy Now</button>
              <EditBid id={item.id} />
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
        <form onSubmit={submitBid}>
          <input type='text' onChange={onValueChange} required />
          <button type='submit'>Make a bid</button>
        </form>
        <button onClick={() => {closeModal(); setSelectedItemId("");}}>close</button>
      </Modal>
    </div>
  )
};