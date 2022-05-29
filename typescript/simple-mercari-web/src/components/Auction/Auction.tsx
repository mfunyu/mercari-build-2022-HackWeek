import React from "react";
import { useEffect, useState } from "react";
import Modal from 'react-modal';

interface Bid {
    id: number;
    bidder_name: string;
    items_id: string;
    bid_price: string;
    item_name: string;
};

interface Item {
    category: string;
    id: string;
    image: string;
    is_auction: number;
    name: string;
    on_sale: number;
    price: string;
};

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


const server = process.env.API_URL || 'http://127.0.0.1:9000';

export default function Auction() {
    const [reload, setReload] = useState(true);
    const onLoadCompleted = () => {setReload(false)}
    const [bids, setBids] = useState<Bid[]>([])
    const [items, setItems] = useState<Item[]>([])
    const [modalIsOpen, setIsOpen] = React.useState(false);
    const [selectedItemId, setSelectedItemId] = React.useState("")
    let subtitle: HTMLHeadingElement| null;
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
    
    const submitAccept = () => {
        fetch(server.concat(`/update/status/${selectedItemId}`),
            {
                method: 'PUT',
                mode: 'cors',
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

    const AcceptBid = ({ id }: { id: string }) => {
        if (items.filter((item) => item.id === id)[0].on_sale === 1) {
            return <button type='submit' onClick={() => {openModal(); setSelectedItemId(id);}}>Accept</button>
        } else {
            return <button type="submit" disabled>Accept</button>
        }
    }

    return(
        <div>
            <header className='Title'>
                <div className='desktop-container'>
                    <a className='menu-item' href="/">Items</a>
                    <a className='menu-item' href="/listing">Listing</a>
                    <a className='menu-button' href="/auction">Auction</a>
                </div>
            </header>
            <div className="Content">
            <div className="auction-table">
                <table>
                    <thead>
                        <tr>
                            <th>Bidder name</th>
                            <th>Item name</th>
                            <th>Bid Price</th>
                            <th></th>
                        </tr>
                    </thead>
                    {bids.map((bid) => {
                        return (
                            <tr key={bid.id}>
                                <td>{bid.bidder_name}</td>
                                <td>{bid.item_name}</td>
                                <td>{bid.bid_price}</td>
                                <td><AcceptBid id={bid.items_id}/></td>
                            </tr>
                        )
                    })}
                </table>
            </div>
            <Modal
                isOpen={modalIsOpen}
                onAfterOpen={afterOpenModal}
                onRequestClose={closeModal}
                style={customStyles}
                contentLabel="Example Modal"
            >
                <h2 ref={(_subtitle) => (subtitle = _subtitle)}>Accept Bid</h2>
                <div>Are you Sure?</div>
                <button type='submit' onClick={() => {closeModal(); setSelectedItemId(""); submitAccept();}}>Accept bid</button>
                <button onClick={() => {closeModal(); setSelectedItemId("");}}>close</button>
            </Modal>
        </div>
        </div>
    )
}