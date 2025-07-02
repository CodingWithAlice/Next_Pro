'use client';
import Link from "next/link";
import config from "config";
import withTypeStorage from "@/components/with-type-storage";
import { useEffect } from "react";
// import { DoubleRightOutlined } from "@ant-design/icons";

function Home() {
    const linksList = [
        { href: './daily', title: '晨昏日志', key: 'daily', img: "/images/daily.png", subTitle: '每日系统自检协议' },
        { href: './week', title: '周频扫描', key: 'week', img: "/images/week.png", subTitle: '每周期诊断报告' },
        { href: `./month?monthId=${config.monthSerial}`, title: '月度沙盘', key: 'month', img: "/images/month.png", subTitle: '布局、推演和重塑' },
        { href: './plans', title: '知行录', key: 'read', img: "/images/read.png", subTitle: '思维培养皿、身体电源' },
    ]
    useEffect(() => {
        // 星空背景
        const numStars = 200;
        for (let i = 0; i < numStars; i++) {
            const star = document.createElement('div');
            star.classList.add('star');
            star.style.left = Math.random() * window.innerWidth + 'px';
            star.style.top = Math.random() * window.innerHeight + 'px';
            star.style.animationDelay = Math.random() * 3 + 's';
            document.body.appendChild(star);
        }
    }, [])


    return (
        <div className="home outer">
            {/* 日常工具 */}
            <a className='a-link' href="http://codingwithalice.top:4001">
                莱特纳盒子学习法
            </a>
            <div className='j-title'>
                J型生存终端
                {/* J型人机耦合 */}
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
                            <Link href={href} className="ribbon-link">
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

export default withTypeStorage(Home);    
