'use client';
import { useState } from "react";
import Link from "next/link";
import { RightOutlined } from "@ant-design/icons";
// import { useRouter } from 'next/navigation';


export default function Home() {
    const [count, setCount] = useState(0);
    // const router = useRouter();
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
        btn: false,
        ul: false
    };

    const products = [
        { title: 'Cabbage', id: 1 },
        { title: 'Garlic', id: 2 },
        { title: 'Apple', id: 3 },
    ];

    // const handleRouter = () => {
    //     router.push('/daily');
    // };
    return (
        <div className="outer">
            <h1>首页</h1>
            {/* 1、测试 按钮简单操作 */}
            {status.btn && <MyButton count={count} onClick={handleClick} />}
            {/* 2、ul 展示 列表 */}
            {status.ul && <ul>
                {products.map(product => (
                    <li key={product.id}>{product.title}</li>
                ))}
            </ul>}
            <Link href='./daily' >
                Daily 日常记录 <RightOutlined />
            </Link>
            <Link href='./square' >
                井字格【两人玩小游戏】 <RightOutlined />
            </Link>
            <Link href='./stock' >
                搜索表单 <RightOutlined />
            </Link>
            <Link href='./week' >
                LTN周报 <RightOutlined />
            </Link>
            {/* <button onClick={handleRouter}>Go to Daily</button> */}
        </div>);
}
