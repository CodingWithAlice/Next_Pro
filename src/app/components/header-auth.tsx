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
		<div style={{
			position: 'fixed',
			top: 12,
			right: 16,
			zIndex: 1000,
			fontSize: 14,
		}}>
			{hasToken ? (
				<span>
					<span style={{ opacity: 0.8, marginRight: 8 }}>已登录</span>
					<button
						type="button"
						onClick={handleLogout}
						style={{
							background: 'none',
							border: 'none',
							color: 'inherit',
							textDecoration: 'underline',
							cursor: 'pointer',
							opacity: 0.9,
						}}
					>
						登出
					</button>
				</span>
			) : (
				<Link href="/login" style={{ opacity: 0.9 }}>
					登录
				</Link>
			)}
		</div>
	);
}
