import { cn } from "@/lib/utils";
import React from "react";

export const PhoneMockup = ({
    children,
    className
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    return (
        <div className={cn(
            "relative border-[#0b0b0b] dark:border-[#f3f3f3] border-[14px] rounded-[3rem] h-[600px] w-[300px] bg-[#0b0b0b] dark:bg-[#f3f3f3] overflow-visible transition-colors duration-300",
            className
        )}>
            {/* Dynamic island */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[110px] h-[30px] bg-black rounded-full z-20 flex items-center justify-end px-3">
                {/* Camera lens */}
                <div className="w-[12px] h-[12px] rounded-full bg-[#111] shadow-inner ml-auto mr-1 relative overflow-hidden flex items-center justify-center">
                    <div className="absolute w-[4px] h-[4px] bg-blue-900/60 rounded-full blur-[0.5px]"></div>
                </div>
            </div>

            {/* Hardware buttons */}
            <div className="absolute -left-[17px] top-[110px] h-[30px] w-[3px] rounded-l-lg bg-[#222] dark:bg-[#d4d4d4] transition-colors duration-300"></div>
            <div className="absolute -left-[17px] top-[160px] h-[55px] w-[3px] rounded-l-lg bg-[#222] dark:bg-[#d4d4d4] transition-colors duration-300"></div>
            <div className="absolute -left-[17px] top-[230px] h-[55px] w-[3px] rounded-l-lg bg-[#222] dark:bg-[#d4d4d4] transition-colors duration-300"></div>
            <div className="absolute -right-[17px] top-[180px] h-[80px] w-[3px] rounded-r-lg bg-[#222] dark:bg-[#d4d4d4] transition-colors duration-300"></div>

            {/* Screen Area (where content goes) */}
            <div className="relative rounded-[2.25rem] overflow-hidden w-full h-full bg-white dark:bg-black">
                {children}
            </div>
        </div>
    );
};
