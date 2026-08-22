'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const TOKEN_KEY = 'j-user-id';

export default function HeaderAuth() {
	const [hasToken, setHasToken] = useState(false);

	useEffect(() => {
		const token = typeof localStorage !== 'undefined'
			? (localStorage.getItem(TOKEN_KEY) || localStorage.getItem('type'))
			: null;
		setHasToken(!!token);
	}, []);

	const handleLogout = () => {
		localStorage.removeItem(TOKEN_KEY);
		localStorage.removeItem('type');
		setHasToken(false);
		window.location.href = '/';
	};

	return (
		<div className="header-auth">
			{hasToken ? (
				<span className="header-auth-inner">
					<span className="header-auth-label">已登录</span>
					<button
						type="button"
						onClick={handleLogout}
						className="header-auth-btn"
					>
						登出
					</button>
				</span>
			) : (
				<Link href="/login" className="header-auth-link">
					登录
				</Link>
			)}
		</div>
	);
}
