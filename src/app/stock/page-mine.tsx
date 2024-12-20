"use client"
import { Checkbox, CheckboxProps, Input, Table, TableProps } from "antd"
import styled from "styled-components";

interface DataType {
    category: string;
    price: string;
    stocked: boolean;
    name: string;
}
const Outer = styled.div`
width: 400px;
margin: 0 auto;`

export default function Stock() {
    const columns: TableProps<DataType>['columns'] = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => <span style={ record.stocked ? {} : {color: 'red'} }>{text}</span>,

        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
        },
    ];
    const data: DataType[] = [
        { category: "Fruits", price: "$1", stocked: true, name: "Apple" },
        { category: "Fruits", price: "$1", stocked: true, name: "Dragonfruit" },
        { category: "Fruits", price: "$2", stocked: false, name: "Passionfruit" },
        { category: "Vegetables", price: "$2", stocked: true, name: "Spinach" },
        { category: "Vegetables", price: "$4", stocked: false, name: "Pumpkin" },
        { category: "Vegetables", price: "$1", stocked: true, name: "Peas" }
    ]

    const handleCheckboxChange: CheckboxProps['onChange'] = (e) => {
        console.log(e.target.checked);
    }
    return <Outer style={{ width: 400 }}>
        <Input placeholder="Search..." />
        <Checkbox onChange={handleCheckboxChange}>Only show products in stock</Checkbox>
        <Table<DataType> columns={columns} dataSource={data} pagination={false} />
    </Outer>
}