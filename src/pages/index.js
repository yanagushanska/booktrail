import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/main.css";
import { mountNavbar } from "../components/navbar.js";

const navbarMount = document.querySelector("#navbar-mount");
mountNavbar(navbarMount);