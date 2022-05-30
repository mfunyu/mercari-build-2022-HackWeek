import React, { ReactElement, useEffect, useState} from 'react';
import Modal from 'react-modal';
import { getToken } from '../Login/Auth'

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
  const [buyNowModalOpen, setBuyNowIsOpen] = React.useState(false);
  const [editModalIsOpen, setIsEditOpen] = React.useState(false);
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
	  headers: {
		'Authorization': 'Bearer '+ getToken()
	  }
    }).then(response => {
      console.log('POST status:', response.statusText);
    }).then(() =>{
      fetchBids()
    }).catch((error) => {
      console.error('POST error:', error);
    })
    closeModal();
  }

  const submitEditedBid = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData()
    data.append('bid_price', values.price)
    fetch(server.concat(`/auction/${selectedItemId}`),
    {
      method: 'PUT',
      mode: 'cors',
      body: data,
	  headers: {
		'Authorization': 'Bearer '+ getToken()
	  }
    }).then(response => {
      console.log('PUT status:', response.statusText);
    }).then(() =>{
      fetchBids()
    }).catch((error) => {
      console.error('PUT error:', error);
    })
    closeEditModal();
  }

  function openEditModal(): any {
    setIsEditOpen(true);
  }

  function afterEditOpenModal() {
    // references are now sync'd and can be accessed.
    if (!subtitle) return
    subtitle.style.color = '#f00';
  }

  function closeEditModal() {
    setIsEditOpen(false);
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

  function openBuyNowModal(): any {
    setBuyNowIsOpen(true);
  }

  function afterOpenBuyNowModal() {
    // references are now sync'd and can be accessed.
    if (!subtitle) return
    subtitle.style.color = '#f00';
  }

  function closeBuyNowModal() {
    setBuyNowIsOpen(false);
  }
  const [items, setItems] = useState<Item[]>([])
  const fetchItems = () => {
    fetch(server.concat('/items'),
      {
        method: 'GET',
        mode: 'cors',
        headers: {
			'Authorization': 'Bearer '+ getToken(),
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
				'Authorization': 'Bearer '+ getToken(),
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

  const deleteBid = () => {
    fetch(server.concat(`/auction/${selectedItemId}`),
    {
      method: 'DELETE',
      mode: 'cors',
	  headers: {
		'Authorization': 'Bearer '+ getToken()
	  }
    }).then(response => {
      console.log('DELETE status:', response.statusText);
    }).then(() =>{
      fetchBids();
      fetchItems();
    }).catch((error) => {
      console.error('DELETE error:', error);
    })
    closeEditModal();
  }

  const buyNow = () => {
    fetch(server.concat(`/update/status/${selectedItemId}`),
    {
        method: 'PUT',
        mode: 'cors',
		headers: {
			'Authorization': 'Bearer '+ getToken()
		}
    }).then(response => {
        console.log('PUT status:', response.statusText);
    }).then(() =>{
        fetchBids()
        fetchItems()
    }).catch((error) => {
        console.error('PUT error:', error);
    })
}

  useEffect(() => {
    if (reload) {
      fetchItems();
      fetchBids();
    }
  }, [reload]);

  const EditBid = ({ id }: { id: string }) => {
    if(bids.filter((bid) => bid.items_id === id).length > 0 && items.filter((item) => item.id === id)[0].on_sale === 1) {
      return <button className='bid' type='submit' onClick={() => {openEditModal(); setSelectedItemId(id);}}>Edit Bid</button>
    } else {
      return <button type='submit' disabled>Edit Bid</button>
    }
  }

  const CreateBid = ({ id }: { id: string }) => {
    if(bids.filter((bid) => bid.items_id === id).length === 0 && items.filter((item) => item.id === id)[0].on_sale === 1 && items.filter((item) => item.id === id)[0].is_auction === 1) {
      return <button type='submit' onClick={() => {openModal(); setSelectedItemId(id);}}>Bid</button>
    } else {
      return <button type='submit' disabled>Bid</button>
    }
  }

  const CurrentBid = ({ id }: { id: string }) => {
    if(bids.filter((bid) => bid.items_id === id).length > 0) {
      const price = bids.filter((bid) => bid.items_id === id)[0].bid_price
      return <span className="item_label"> Your Bid: {price}</span>
    } else {
      return <span></span>
    }
  }
  const Sold = ({ id }: { id: string }) => {
    if(items.filter((item) => item.id === id)[0].on_sale === 1) {
      return <span></span>
    } else {
      return <span>Sold</span>
    }
  }

  const BuyNow = ({ id }: { id: string }) => {
    if(items.filter((item) => item.id === id)[0].on_sale === 1) {
      return <button type='submit' onClick={() => {openBuyNowModal(); setSelectedItemId(id)}}>Buy Now</button>
    } else {
      return <button type='submit' disabled>Buy Now</button>
    }
  }

  return (
    <div className='Content'>
    <div className='wrapper' >
      {items.map((item) => {
        return (
          <div key={item.id} className='ItemList'>
            <div className='image-box'>
              <img src= {`${server}/image/${item.image}`} className='image' alt='not available'/>
            </div>
            <p>
              <span className="item_label">Name:</span> {item.name}
              <br />
              <span className="item_label">Category:</span> {item.category}
              <br />
              <span className="item_label">Price:</span> {item.price}
              <br />
              <CurrentBid id={item.id}></CurrentBid>
              <br />
              <Sold id={item.id}></Sold>
            </p>
            <p>
              <BuyNow id={item.id} />
              <CreateBid id={item.id} />
              <EditBid id={item.id} />
            </p>
          </div>
        )
    })}
    </div>
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
        <button className='close-button' onClick={() => {closeModal(); setSelectedItemId("");}}>close</button>
      </Modal>
      <Modal
        isOpen={editModalIsOpen}
        onAfterOpen={afterEditOpenModal}
        onRequestClose={closeEditModal}
        style={customStyles}
        contentLabel="Example Modal"
      >
        <h2 ref={(_subtitle) => (subtitle = _subtitle)}>Edit Bid</h2>
        <div>Enter bid amount</div>
        <form onSubmit={submitEditedBid}>
          <input type='text' onChange={onValueChange} required />
          <button type='submit'>Edit bid</button>
        </form>
        <button type='submit' onClick={() => {closeEditModal(); setSelectedItemId(""); deleteBid();}}>Delete bid</button>
        <button className='close-button' onClick={() => {closeEditModal(); setSelectedItemId("");}}>close</button>
      </Modal>
      <Modal
        isOpen={buyNowModalOpen}
        onAfterOpen={afterOpenBuyNowModal}
        onRequestClose={closeBuyNowModal}
        style={customStyles}
        contentLabel="Example Modal"
      >
        <h2 ref={(_subtitle) => (subtitle = _subtitle)}>Confirm buy</h2>
        <div>Pay full price?</div>
        <button type='submit' onClick={() => {closeBuyNowModal(); buyNow(); setSelectedItemId("");}}>Buy Now</button>
        <button className='close-button' onClick={() => {closeBuyNowModal(); setSelectedItemId("");}}>close</button>
      </Modal>
    </div>
  )
};