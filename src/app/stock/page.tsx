interface Product {
    category: string,
    price: string,
    stocked: boolean,
    name: string
}
interface TransProduct {
    [key: string]: Product[];
}

function SearchWrap() {
    return <>
        <input type="text" placeholder="Search..." />
        <br />
        <input type="checkbox" /><label>Only show products in stock</label>
    </>
}

function CategoryTable({ type, data }: { type: string, data: Product[] }) {
    return <>
        <tr>
            <th colSpan={2}>{type}</th>
        </tr>
        {data.map((it, index) => <tr key = {index}>
                <td style={{ color: !it.stocked ? 'red' : '' }}>{it.name}</td>
                <td>{it.price}</td>
            </tr>)}
    </>

}

function DetailTable({ products }: { products: Product[] }) {
    // 数据按照 category 分类
    function ClassifyByCategory(data: Product[]) {
        return data.reduce<TransProduct>((pre, cur) => {
            const c = cur.category;
            if (!pre[c]) {
                pre[c] = [];
            }
            pre[c].push(cur);
            return pre;
        }, {})
    }
    const categoryData = ClassifyByCategory(products);
    const categories = Object.keys(categoryData);
    return <table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Price</th>
            </tr>
        </thead>
        <tbody>
            {categories.map((it, index) => <CategoryTable key={index} type={it} data={categoryData[it]} />)}
        </tbody>
    </table>
}

const PRODUCTS = [
    { category: "Fruits", price: "$1", stocked: true, name: "Apple" },
    { category: "Fruits", price: "$1", stocked: true, name: "Dragonfruit" },
    { category: "Fruits", price: "$2", stocked: false, name: "Passionfruit" },
    { category: "Vegetables", price: "$2", stocked: true, name: "Spinach" },
    { category: "Vegetables", price: "$4", stocked: false, name: "Pumpkin" },
    { category: "Vegetables", price: "$1", stocked: true, name: "Peas" }
];

export default function Outer() {
    return <>
        <SearchWrap />
        <DetailTable products={PRODUCTS} />
    </>
}