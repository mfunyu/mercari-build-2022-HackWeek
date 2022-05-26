import { Link } from "react-router-dom"

export default function Auction() {
    return(
        <div>
            <header className='Title'>
                <p><Link to="/">Listing</Link> | <Link to="/auction">Auction</Link></p>
            </header>
            <table>
                <tr>
                    <th>Bidder</th>
                    <th>Price</th>
                    <th>#</th>
                </tr>
                <tr>
                    <td>Mock</td>
                    <td>Data</td>
                    <td></td>
                </tr>
            </table>
        </div>
    )
}