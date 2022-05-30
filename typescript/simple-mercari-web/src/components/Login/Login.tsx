import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from 'react-modal';
import PropTypes from 'prop-types';
import { stringify } from "querystring";

const server = process.env.API_URL || 'http://127.0.0.1:9000';

interface formDataType {
	username: string,
	password: string,
}

async function login(data: FormData) {
	return fetch(server.concat('/login'), {
		method: 'POST',
		mode: 'cors',
		body: data,
	})
	.then(data => data.json())
}

async function getId(token: any) {
	const auth = 'Bearer ' + token
	return fetch(server.concat('/protected'), {
		method: 'GET',
		mode: 'cors',
		headers: new Headers({
			'Authorization': auth
		})
	})
		.then(data => data.json())
}

export default function Login({ setToken, setUserId}: any) {
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

	const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		const data = new FormData()
		console.log(values.username)
		console.log(values.password)
		data.append('username', values.username)
		data.append('password', values.password)

		const token = await login(data)
		setToken(token);
		const userId = await getId(token['access_token'])
		setUserId(userId);
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
							<input type='text' name='username' id='username' placeholder='Name' onChange={onValueChange} required />
							<input type='text' name='password' id='password' placeholder='Price' onChange={onValueChange} required />
							<button type='submit'>Login</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}

Login.propTypes = {
  setToken: PropTypes.func.isRequired,
  setUserId: PropTypes.func.isRequired
}