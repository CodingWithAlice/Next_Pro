"use client";
import Period from "@/components/week-period";
import { useSearchParams } from "next/navigation";

export default function WeekPeriod() {
    const urlParams = useSearchParams();
    const curSerial = +(urlParams?.get('serialNumber') || 0);
    return <Period curSerial={curSerial} />
} 