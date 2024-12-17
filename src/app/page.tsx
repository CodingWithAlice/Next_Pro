'use client';
import { useState } from "react";
import Square from '../components/square/app';
import Daily from "@/components/daily/app";

export default function Home() {
    const [count, setCount] = useState(0);
    function handleClick() {
        alert('You clicked me!');
        setCount(count + 1);
    }

    function MyButton({ count, onClick }: { count: number, onClick: () => void }) {
        return (
            <button onClick={onClick}>Click {count} times</button>
        );
    }
    const status = {
        cat: 'aQiu',
        url: '',
        // url: 'https://i.imgur.com/yXOvdOSs.jpg',
        width: '100px',
        height: '100px',
        placeholder: 'loading',
        ul: false,
        btn: false,
        square: false,
    };

    const products = [
        { title: 'Cabbage', id: 1 },
        { title: 'Garlic', id: 2 },
        { title: 'Apple', id: 3 },
    ];
    return (
        <div className="outer">
            {/* <h1>Welcome to my {status.cat}</h1> */}
            {status.btn && <MyButton count={count} onClick={handleClick} />}
            {status.url && <img
                className="img"
                src={status.url}
                alt={status.placeholder}
                style={{
                    width: status.width,
                    height: status.height,
                }} />}
            {status.ul && <ul>
                {products.map(product => (
                    <li key={product.id}>{product.title}</li>
                ))}
            </ul>}
            {status.square && <Square />}
            <Daily />
            
        </div>);
}
