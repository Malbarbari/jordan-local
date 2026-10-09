import type { ButtonHTMLAttributes, InputHTMLAttributes, HTMLAttributes } from "react";
export function Button({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) { return <button className={`button ${className}`} {...props}/>; }
export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) { return <input className={`input ${className}`} {...props}/>; }
export function Card({ className = "", ...props }: HTMLAttributes<HTMLElement>) { return <section className={`card ${className}`} {...props}/>; }
export function Badge({ className = "", ...props }: HTMLAttributes<HTMLSpanElement>) { return <span className={`badge ${className}`} {...props}/>; }
