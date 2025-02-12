"use client"

import { useEffect, useState } from "react";

interface Product {
    category: string,
    price: string,
    stocked: boolean,
    name: string
}
interface TransProduct {
    [key: string]: Product[];
}

function SearchWrap({ onTextChange, onCheckChange }: { onTextChange: (value: string) => void, onCheckChange: (checked: boolean) => void }) {
    return <>
        <input type="text" placeholder="Search..." onChange={e => onTextChange(e.target.value)} />
        <br />
        <input type="checkbox" onChange={e => onCheckChange(e.target.checked)} /><label>Only show products in stock</label>
    </>
}

function CategoryTable({ type, data }: { type: string, data: Product[] }) {
    return <>
        <tr>
            <th colSpan={2}>{type}</th>
        </tr>
        {data.map((it, index) => <tr key={index}>
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
    const [searchText, setSearchText] = useState('');
    const [searchCheck, setSearchCheck] = useState(false);
    const [pros, setPros] = useState(PRODUCTS);



    useEffect(() => {
        const filterPros = () => {
            if (!searchText && !searchCheck) {
                // 都为空 - 展示全部
                return PRODUCTS;
            }
            if (searchText && searchCheck) {
                // 都不为空 - 同时筛选
                return PRODUCTS.filter(it => it.stocked && it.name.includes(searchText));
            }
            if (searchCheck) {
                return PRODUCTS.filter(it => it.stocked);
            }
            return PRODUCTS.filter(it => it.name.includes(searchText));
        }
        setPros(filterPros());
    }, [searchText, searchCheck])
    // 处理筛选后的数据
    return <>
        <SearchWrap onTextChange={setSearchText} onCheckChange={setSearchCheck} />
        <DetailTable products={pros} />
    </>
}