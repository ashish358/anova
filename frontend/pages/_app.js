import "../styles/globals.css";

//INTRNAL IMPORT
import { NavBar, Footer } from "../components/componentsindex";
import { NFTMarketPlaceProvider } from "../context/NFTMarketPlaceContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const MyApp = ({ Component, pageProps }) => (
  <div>
    <ToastContainer position="top-right" autoClose={3000} />
    <NFTMarketPlaceProvider>
    <NavBar />
    <Component {...pageProps} />
    <Footer />

    </NFTMarketPlaceProvider>
  </div>
);

export default MyApp;
