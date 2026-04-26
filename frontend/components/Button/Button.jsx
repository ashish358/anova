import React from "react";

//INTERNAL IMPORT
import Style from "./Button.module.css";

const Button = ({ btnName, handleClick, icon, classStyle ,disabled }) => {
  return (
    <div className={Style.box} >
      <button 
        className= {`${Style.button} ${classStyle} p-2`}
        // onClick={() =>  handleClick()}
              onClick={() => handleClick && handleClick()}
      disabled={disabled}
      >
        {icon} {btnName}
      </button>
    </div>
  );
};

export default Button;
