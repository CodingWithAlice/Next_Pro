import EditTable from "../components/edible-table";
import { Link } from "react-router-dom";

export default function Main() {
    return <div className="App">
        <h1 className='title'>
            J人热爱统计的一生
            <Link to="/ltn" className="ltn">莱特纳盒子</Link>
        </h1>
        <EditTable />
    </div>
}