'use client';
import { useState } from "react";
import Link from "next/link";
import config from "config";
// import { DoubleRightOutlined } from "@ant-design/icons";

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

    const linksList = [
        { href: './daily', title: 'Daily日常', key: 'daily', img: "/images/daily.png" },
        { href: './week', title: 'LTN周报', key: 'week', img: "/images/week.png" },
        { href: `./month?monthId=${config.monthSerial}`, title: 'LTN月报', key: 'month', img: "/images/month.png" },
        { href: './read', title: '二次阅读', key: 'read', img: "/images/read.png" },
    ]

    return (
        <div className="outer">
            {/* 1、测试 按钮简单操作 */}
            {status.btn && <MyButton count={count} onClick={handleClick} />}
            {/* 2、ul 展示 列表 */}
            {status.ul && <ul>
                {products.map(product => (
                    <li key={product.id}>{product.title}</li>
                ))}
            </ul>}
            {/* 日常工具 */}
            <div className='j-title'>
                J人复盘工具
            </div>
            <br />
            {/* <Link href={'/ltn'}>
                莱特纳盒子学习法
                <DoubleRightOutlined />
            </Link> */}
            {/* 手机端 - 绶带 */}
            <section className="links">

                {
                    linksList.map(({ href, title, key }) => {
                        return <div className="ribbon" key={key}>
                            <Link href={href} >
                                {title}
                            </Link>
                        </div>
                    })
                }
            </section>
            {/* 电脑端 - 图片集 */}
            <div className="images-wrap">
                <ul>
                    {linksList.map(({ href, title, key, img }) => {
                        return <li key={key}>
                            <Link href={href} >
                                <div className="image_title">
                                    {title}
                                </div>
                                <img className="poster" src={img} alt={title} />
                            </Link>

                        </li>
                    })}
                </ul>
            </div>

            {/* <Link href='./square' >
                井字格【两人玩小游戏】 <RightOutlined />
            </Link>
            <Link href='./stock' >
                搜索表单 <RightOutlined />
            </Link> */}
            {/* <button onClick={handleRouter}>Go to Daily</button> */}
        </div>);
}
