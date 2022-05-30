import React from 'react';

export function setToken(userToken: any) {
	sessionStorage.setItem('access_token', JSON.stringify(userToken));
}

export function setUserId(userId: any) {
	sessionStorage.setItem('id', JSON.stringify(userId));
}

export function getUserId() {
	const userIdString = sessionStorage.getItem('id');
	if (!userIdString)
		return "";
	const userId = JSON.parse(userIdString);
	return userId?.id
}

export function getToken(): string{
	const tokenString = sessionStorage.getItem('access_token');
	if (!tokenString)
		return "";
	const userToken = JSON.parse(tokenString);
	return userToken?.access_token
}
