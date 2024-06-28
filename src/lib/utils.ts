import clsx, { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

//helps in merging the css classes
export function cn(...inputs: ClassValue[]){
    return twMerge(clsx(inputs))

}