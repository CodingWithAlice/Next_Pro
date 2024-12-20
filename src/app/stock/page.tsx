import { JSX } from "react";

interface DataType {
    category: string;
    price: string;
    stocked: boolean;
    name: string;
}
function ProductCategoryRow({ category }: { category: string }) {
    return (
        <tr>
            <th colSpan={2}>
                {category}
            </th>
        </tr>
    );
}
function ProductRow({ product }: { product: DataType }) {
    const name = product.stocked ? product.name :
        <span style={{ color: 'red' }}>
            {product.name}
        </span>;
    return (
        <tr>
            <td>{name}</td>
            <td>{product.price}</td>
        </tr>
    );
}
function SearchBar() {
    return (<form>
        <input type="text" placeholder="search..." />
        <label>
            <input type="checkbox" />
            Only show products in stock
        </label>
    </form>)
}
function ProductTable({ products }: { products: DataType[] }) {
    const rows: JSX.Element[] = [];
    let lastCategory = '';
    products.forEach((it) => {
        if (it.category !== lastCategory) {
            rows.push(<ProductCategoryRow
                category={it.category}
                key={it.category} />)
        }
        rows.push(
            <ProductRow
                product={it}
                key={it.name} />
        );
        lastCategory = it.category;
    })
    return (<table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Price</th>
            </tr>
        </thead>
        <tbody>
            {rows}
        </tbody>
    </table>)
}

function FilterableProductTable({ products }: { products: DataType[] }) {
    return (
        <div>
            <SearchBar />
            <ProductTable products={products} />
        </div>
    );
}
const PRODUCTS = [
    { category: "Fruits", price: "$1", stocked: true, name: "Apple" },
    { category: "Fruits", price: "$1", stocked: true, name: "Dragonfruit" },
    { category: "Fruits", price: "$2", stocked: false, name: "Passionfruit" },
    { category: "Vegetables", price: "$2", stocked: true, name: "Spinach" },
    { category: "Vegetables", price: "$4", stocked: false, name: "Pumpkin" },
    { category: "Vegetables", price: "$1", stocked: true, name: "Peas" }
];

export default function App() {
    return <FilterableProductTable products={PRODUCTS} />;
}