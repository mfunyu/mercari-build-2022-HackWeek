import { useEffect, useState } from "react";
import { Link } from "react-router-dom"

interface Bid {
    id: number;
    bidder_name: string;
    items_id: string;
    bid_price: string;
    item_name: string;
  };

const server = process.env.API_URL || 'http://127.0.0.1:9000';

export default function Auction() {
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
            })
            .catch(error => {
                console.error('GET error:', error)
            })
    }

    useEffect(() => {
        fetchBids();
      }, []);

    return(
        <div>
            <header className='Title'>
                <p><Link to="/">Listing</Link> | <Link to="/auction">Auction</Link></p>
            </header>
            <div className="auction-table">
                <table>
                    <tr>
                        <th>Item name</th>
                        <th>Bid Price</th>
                        <th></th>
                    </tr>
                    {bids.map((bid) => {
                        return (
                            <tr key={bid.id}>
                                <td>{bid.item_name}</td>
                                <td>{bid.bid_price}</td>
                                <td><button>Accept</button></td>
                            </tr>
                        )
                    })}
                </table>
            </div>
        </div>
    )
}