"use client";
import Period from "@/components/week-period";
import { useSearchParams } from "next/navigation";
import "../app.css";

export default function WeekPeriod() {
    const urlParams = useSearchParams();
    const curSerial = +(urlParams?.get('serialNumber') || 0);
    return (
        <div className="period-page-container">
            <Period curSerial={curSerial} />
        </div>
    );
} 