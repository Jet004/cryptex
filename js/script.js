//-------------------------> START SVG DYNAMIC HEIGHT LOGIC
const loadSVGLine = () => {
  // Get height of page-container
  let sideBar = document.getElementById("side-bar");
  let sideBarHeight = sideBar.offsetHeight;
  let sideBarWidth = sideBar.offsetWidth;
  // Get svg verticle line
  let vLine = document.getElementById("v-line");
  let line = document.querySelector("#v-line > line");
  vLine.setAttribute("width", "1px");
  vLine.setAttribute("height", sideBarHeight);
  line.setAttribute("x1", "1");
  line.setAttribute("y1", "0");
  line.setAttribute("x2", "1");
  line.setAttribute("y2", sideBarHeight);
};

//-------------------------> START TRADINGVIEW LOGIC

// Create tradingview widget
let loadTVWidget = () => {
  new TradingView.widget({
    autosize: true,
    symbol: "BITSTAMP:BTCUSD",
    interval: "D",
    timezone: "Australia/Brisbane",
    theme: "dark",
    style: "1",
    locale: "en",
    toolbar_bg: "#f1f3f6",
    enable_publishing: false,
    withdateranges: true,
    hide_side_toolbar: false,
    allow_symbol_change: true,
    container_id: "tradingview_45903",
  });
};

//-------------------------> START SPA LOGIC
// Gat all nav links
let navLinks = document.getElementsByClassName("nav-link");

// Function to handle page changes and remember last page visited
const changePage = (e) => {
  let clickedLink = e.target;
  // Return if clicked link already active
  if (clickedLink.classList.contains("active")) return;
  // Set correct active status for all nav links
  for (link of navLinks) {
    link === clickedLink
      ? link.classList.add("active")
      : link.classList.remove("active");
  }

  // Get id stub from nav link so we can correctly identify the page to change to
  let pageID = clickedLink.id.split("-")[0] + "-page";

  // Get all page sections so we can change the display to the correct content
  let pages = document.getElementsByClassName("page");
  // Set correct display settings for each page
  for (page of pages) {
    page.id === pageID
      ? (page.style.display = "flex")
      : (page.style.display = "none");
  }

  // Call loadTVWidget so chart loads when directed to charts page
  if (pageID === "charts-page") {
    loadTVWidget();
  } else {
    // Destroy existing widget
    document.getElementById("tradingview_45903").innerHTML = "";
  }
  // Set current page to localStorage
  localStorage.setItem("page", pageID.split("-")[0]);

  // Reset SVG line length
  loadSVGLine();
};

// Set click event listener on all nav links
for (link of navLinks) {
  link.addEventListener("click", changePage);
}

// Set click event listener on top brand link to change to home page
document.getElementById("brand-link").addEventListener("click", () => {
  document.getElementById("home-link").click();
});

//-------------------------> END SPA LOGIC

//-------------------------> START LOCALSTORAGE LOGIC

let currentPage = localStorage.getItem("page");
if (!currentPage) currentPage = "home";
document.getElementById(currentPage + "-link").click();

let delayTVLoad;
window.onresize = () => {
  // Get TV widget parent and clear iframe if chart page is the active page
  if (currentPage === "charts") {
    let tvWidget = (document.getElementById("tradingview_45903").innerHTML =
      "");
    clearTimeout(delayTVLoad);
    delatTVLoad = setTimeout(loadTVWidget, 100);
  }

  // Reset svg separator's size/position
  loadSVGLine();
};

//-------------------------> END LOCALSTORAGE LOGIC

// Object with crypto data

let cryptoData = {
  BTC: {
    rank: 1,
    imgPath: "./images/btc.svg",
    name: "Bitcoin",
    code: "BTC",
    price: 65300,
    mcap: "1,229,447,708,943",
    change: 1.56,
  },
  ETH: {
    rank: 2,
    imgPath: "./images/eth.svg",
    name: "Ethereum",
    code: "ETH",
    price: 4788,
    mcap: "567,006,255,493",
    change: 4.34,
  },
  BNB: {
    rank: 3,
    imgPath: "./images/bnb.svg",
    name: "Binance",
    code: "BNB",
    price: 632,
    mcap: "105,837,629,126",
    change: 4.21,
  },
  ADA: {
    rank: 4,
    imgPath: "./images/ada.svg",
    name: "Cardano",
    code: "ADA",
    price: 2.1,
    mcap: "69,506,655,717",
    change: 1.52,
  },
  SOL: {
    rank: 5,
    imgPath: "./images/sol.svg",
    name: "Solana",
    code: "SOL",
    price: 237.54,
    mcap: "71,713,797,279",
    change: 1.12,
  },
  XRP: {
    rank: 6,
    imgPath: "./images/xrp.svg",
    name: "XRP",
    code: "XRP",
    price: 1.22,
    mcap: "57,753,046,781",
    change: 2.84,
  },
  DOT: {
    rank: 7,
    imgPath: "./images/dot.svg",
    name: "Polkadot",
    code: "DOT",
    price: 47.18,
    mcap: "46,589,246,297",
    change: 2.42,
  },
  LTC: {
    rank: 8,
    imgPath: "./images/ltc.svg",
    name: "Litecoin",
    code: "LTC",
    price: 275.82,
    mcap: "19,018,231,448",
    change: 7.14,
  },
  LINK: {
    rank: 9,
    imgPath: "./images/link.svg",
    name: "Chainlink",
    code: "LINK",
    price: 35.29,
    mcap: "16,373,766,859",
    change: 2.79,
  },
  UNI: {
    rank: 10,
    imgPath: "./images/uni.svg",
    name: "Uniswap",
    code: "UNI",
    price: 25.62,
    mcap: "16,080,812,807",
    change: 1.74,
  },
  ALGO: {
    rank: 11,
    imgPath: "./images/algo.svg",
    name: "Algorand",
    code: "ALGO",
    price: 2.11,
    mcap: "13,203,675,640",
    change: 10.04,
  },
};

let tableOutputHTML = ``;
let coinSelectHTML = ``;
// Loop over data and put in price table
for (const [key, coin] of Object.entries(cryptoData)) {
  tableOutputHTML += `
        <tr scope="row" id="coin-${coin.code}">
            <td class="td-rank ps-3">${coin.rank}</td>
            <td class="td-name"><img src="${coin.imgPath}" alt="${coin.code}"><span class="name px-2">${coin.name}</span><span class="code pe-2">${coin.code}</span></td>
            <td class="td-price">$${coin.price}</td>
            <td class="td-mcap d-none d-md-table-cell">$${coin.mcap}</td>
            <td class="td-change">${coin.change}%</td>
        </tr>
    `;

  coinSelectHTML += `
        <option value="${coin.code}">${coin.name}</option>
    `;
}
document.getElementById("coin-data-table").innerHTML = tableOutputHTML;
document.getElementById("coin").innerHTML += coinSelectHTML;

// Function to set clicked coin's name to trade form and show trade form
let goToTrade = (coinCode) => {
  // Set nav link to trade page
  document.getElementById("trade-link").click();
  // Set crypto select to clicked crypto
  document.getElementById("coin").value = coinCode;
};

// Set click event listeners on table rows to populate trade form and "redirect"
let tableRows = document.getElementsByTagName("tr");
for (row of tableRows) {
  // Get coin code from row
  let code = row.id.split("-")[1];
  row.addEventListener("click", () => {
    goToTrade(code);
  });
}

// Set click event listeners on side links to populate trade form and "redirect"
let sideLinks = document.querySelectorAll("#side-link-cont > a > img");
for (const item of sideLinks) {
  item.addEventListener("click", () => {
    goToTrade(item.alt);
  });
}

let showLimitPrice = () => {
  if (orderType.value === "limit") {
    // Show limit price input
    document.getElementById("limit-price").style.display = "block";
  } else {
    document.getElementById("limit-price").style.display = "none";
  }
};

// Set change event listener to show limit price if order type is limit
let orderType = document.getElementById("buy-sell-select");
orderType.addEventListener("change", showLimitPrice);
showLimitPrice();

//--------------------------> PORTFOLIO LOGIC
// Get totals from each row in portfolio
let totals = document.getElementsByClassName("row-total");
let subtotal = 0;
for (let total of totals) {
  subtotal += Number(total.innerHTML);
}
document.getElementById("portfolio-value").innerHTML += subtotal;

window.onload = loadSVGLine;
