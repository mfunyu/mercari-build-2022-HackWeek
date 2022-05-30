import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from 'react-modal';
import PropTypes from 'prop-types';

const server = process.env.API_URL || 'http://127.0.0.1:9000';

interface formDataType {
	username: string,
	password: string,
}

function register(data: FormData) {
	return fetch(server.concat('/register'), {
		method: 'POST',
		mode: 'cors',
		body: data,
	})
	.then(data => data.json())
}

export default function Register() {
	let navigate = useNavigate(); 
	const routeChange = () =>{ 
	  let path = `/`; 
	  navigate(path);
	}

	const initialState = {
		username: "",
		password: ""
	}

	const [values, setValues] = useState<formDataType>(initialState);

	const onValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setValues({
			...values, [event.target.name]: event.target.value,
		})
	};

	const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		const data = new FormData()
		console.log(values.username)
		console.log(values.password)
		data.append('username', values.username)
		data.append('password', values.password)

		register(data)
	};

	return (
		<div>
			<header className='Title'>
				<div className='desktop-container'>
					<a className='menu-item' href="/">Items</a>
					<a className='menu-item' href="/listing">Listing</a>
				</div>
			</header>
			<div className='Content'>
				<div className='Listing'>
					<form onSubmit={onSubmit}>
						<div className="form">
							<input type='text' name='username' id='username' placeholder='username' onChange={onValueChange} required />
							<input type='text' name='password' id='password' placeholder='password' onChange={onValueChange} required />
							<button type='submit'>SignUp</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
