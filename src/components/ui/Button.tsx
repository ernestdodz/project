import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  className = '', 
  disabled = false,
  ...props 
}) => {
  return (
    <button
      className={`
        px-4 py-2 rounded-md font-medium flex items-center justify-center
        transition-all duration-200 ease-in-out
        ${disabled ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;