import React from "react";
import Image from "next/image";
import {
  TiSocialFacebook,
  TiSocialLinkedin,
  TiSocialTwitter,
  TiSocialYoutube,
  TiSocialInstagram,
  TiArrowSortedDown,
  TiArrowSortedUp,
} from "react-icons/ti";
import { RiSendPlaneFill } from "react-icons/ri";

//INTERNAL IMPORT
import Style from "./Footer.module.css";
import images from "../../img";
import { Discover, HelpCenter } from "../NavBar/index";
// import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useContext, useState,useEffect } from "react";
// import axios from "axios";
import { NFTMarketPlaceContext } from "../../context/NFTMarketPlaceContext.js";


const Footer = () => {
  const [email, setEmail] = useState("");
  const { setUserEmail } = useContext(NFTMarketPlaceContext);
// const [email, setEmail] = useState("");

//   const handleSubscribe = async () => {
//   try {
//     const res = await axios.post("/api/subscribe", { email });
//     alert(res.data.message);
//     setEmail("");
//   } catch (err) {
//     console.log(err);
//     alert("Error");
//   }
// };
// const handleSubscribe = async () => {
//   try {
//     const res = await axios.post("/api/subscribe", { email });

//     if (res.data.success || res.data.message === "Subscribed successfully") {
//       toast.success("🎉 Thanks for subscribing! You'll get early notifications.");
//       setEmail("");
//         setUserEmail(email);
//     } else {
//       toast.info(res.data.message);
//     }

//   } catch (err) {
//     console.log(err);
//     toast.error("Something went wrong");
//   }
// };  

const handleSubscribe = async () => {
  try {
    if (!email) {
      return toast.error("Please enter email");
    }

    const res = await axios.post("/api/subscribe", { email });

    if (res.data.success || res.data.message === "Subscribed successfully") {
      
      // ✅ FIRST store in context
      setUserEmail(email);
localStorage.setItem("userEmail", email);
      console.log("Context email set:", email);

      // ✅ THEN clear input
      setEmail("");

      toast.success("🎉 Thanks for subscribing! You'll get early notifications.");
      
    } else {
      toast.info(res.data.message);
    }

  } catch (err) {
    console.log(err);
    toast.error("Something went wrong");
  }
};

// useEffect(() => {
//   const storedEmail = localStorage.getItem("userEmail");
//   if (storedEmail) {
//     setUserEmail(storedEmail);
//   }
// }, []);

return (
    <div className={Style.footer}>
      <div className={Style.footer_box}>
        <div className={Style.footer_box_social}>
          <div className="flex items-center gap-4 align-text-bottom  ">
          <Image src={images.navlogo_4c5773}  alt="footer logo" height={30} width={30} />
  <p className="text-xl font-bold  tracking-wide">Anova</p>

        </div>
          <p>
            The world’s first and largest digital marketplace for crypto
            collectibles and non-fungible tokens (NFTs). Buy, sell, and discover
            exclusive digital items.
          </p>

          <div className={Style.footer_social}>
            <a href="#">
              <TiSocialFacebook />
            </a>
            <a href="#">
              <TiSocialLinkedin />
            </a>
            <a href="#">
              <TiSocialTwitter />
            </a>
            <a href="#">
              <TiSocialYoutube />
            </a>
            <a href="#">
              <TiSocialInstagram />
            </a>
          </div>
        </div>

        <div className={Style.footer_box_discover}>
          <h3>Discover</h3>
          <Discover />
        </div>

        <div className={Style.footer_box_help}>
          <h3>Help Center</h3>
          <HelpCenter />
        </div>

        <div className={Style.subscribe}>
          <h3>Subscribe</h3>

          <div className={Style.subscribe_box}>
            {/* <input type="email" placeholder="Enter your email *" /> */}
{/* <input
  type="email"
  placeholder="Enter your email *"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/> */}
<input
  type="email"
  placeholder="Enter your email *"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

            <RiSendPlaneFill className={Style.subscribe_box_send}   onClick={handleSubscribe} />
          </div>
          <div className={Style.subscribe_box_info}>
            <p>
              Discover, collect, and sell extraordinary NFTs OpenSea is the
              world first and largest NFT marketplace
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
