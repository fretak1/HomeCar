"use client";

import Image from 'next/image';

interface LogoProps {
    className?: string; // This will control the width/height of the container
    priority?: boolean;
}

export const Logo = ({ 
    className = "h-10 w-auto", 
    priority = false 
}: LogoProps) => {
    return (
        <div className={`relative ${className}`}>
            <Image
                src="/e.png"
                alt="HomeCar Logo"
                width={500}
                height={200}
                className="w-full h-full object-contain"
                priority={priority}
            />
        </div>
    );
};
