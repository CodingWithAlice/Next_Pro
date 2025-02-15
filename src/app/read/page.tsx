import './app.css';

export default function ReadPage() {
    return <div className='read'>
        <nav className="layer">
            <ul>
                <li><a href="">Home</a></li>
                <li><a href="">About</a></li>
                <li><a href="">Portfolio</a></li>
                <li><a href="">Blog</a></li>
                <li><a href="">Contact</a></li>
            </ul>
        </nav>

        <section className="front layer">
            <h1 className='books'>《有效阅读》 <br />
            首次阅读：2018年8月<br />
            重读时间：2025年1月</h1>
        </section>
    </div>
}