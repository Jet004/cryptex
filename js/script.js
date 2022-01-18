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
const changePage = e => {
    let clickedLink = e.target;
    // Return if clicked link already active
    if (clickedLink.classList.contains("active")) return;
    // Set correct active status for all nav links
    for (link of navLinks) {
        link === clickedLink ? link.classList.add("active") : link.classList.remove("active");
    }

    // Get id stub from nav link so we can correctly identify the page to change to
    let pageID = clickedLink.id.split("-")[0] + "-page";

    // Get all page sections so we can change the display to the correct content
    let pages = document.getElementsByClassName("page");
    // Set correct display settings for each page
    for (page of pages) {
        page.id === pageID ? (page.style.display = "flex") : (page.style.display = "none");
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

let delayTVLoad;
window.onresize = () => {
    // Get TV widget parent and clear iframe if chart page is the active page
    if (currentPage === "charts") {
        let tvWidget = (document.getElementById("tradingview_45903").innerHTML = "");
        clearTimeout(delayTVLoad);
        delatTVLoad = setTimeout(loadTVWidget, 100);
    }

    // Reset svg separator's size/position
    loadSVGLine();
};

//-------------------------> END SPA LOGIC

//-------------------------> START LOCALSTORAGE LOGIC

// Handle page load when client reopens site
let currentPage = localStorage.getItem("page");
if (!currentPage) currentPage = "home";
document.getElementById(currentPage + "-link").click();

// Define GLOBAL variables
let CashBalance
let OpenPositions
let UserPreferences
let CurrencyPreference

// Set initial state
const setInitialState = () => {
    if(!localStorage.getItem("currentPriceData")) localStorage.setItem("currentPriceData", '{}')
    if(!localStorage.getItem("openLimitOrders")) localStorage.setItem("openLimitOrders", '[]')
    if(!localStorage.getItem("openPositions")) localStorage.setItem("openPositions", '[]')
    if(!localStorage.getItem("orderHistory")) localStorage.setItem("orderHistory", '[]')
    if(!localStorage.getItem("cashBalance")) localStorage.setItem("cashBalance", '100000')
}

setInitialState()

// Reset trading account
const resetTradingAccoung = () => {
    let title = "Confirm Account Reset"
    let content = "Do you really want to delete all trading account data? This operation can't be undone"
    let confirmBtnText = "Reset"

    let action = () => {
        localStorage.clear()
        localStorage.setItem("page", currentPage)
        setInitialState()
        // Force refresh to ensure that initial data loads properly
        window.location.href = window.location.href
    }
    buildModal(title, content, confirmBtnText, action)
}

document.getElementById('reset-account-btn').addEventListener('click', () => {
    resetTradingAccoung()
})

const adjustCashBalance = (amount) => {
    let cashBalance = Number(localStorage.getItem("cashBalance"))
    cashBalance += amount
    localStorage.setItem("cashBalance", cashBalance)
}

const adjustOpenPositions = (order) => {
    let openPositions = JSON.parse(localStorage.getItem("openPositions"))
    let coinPosition = openPositions.filter(position => position.coin === order.coin)

    if(order.type === "Buy") {
        if(coinPosition.length === 0) {
            openPositions.push({
                coin: order.coin,
                quantity: order.quantity,
                averagePrice: order.price
            })
            console.log(openPositions)

        } else if(coinPosition.length > 0) {
            let totalQuantity = coinPosition[0].quantity + order.quantity
            let averagePrice = ((coinPosition[0].quantity * coinPosition[0].averagePrice) + (order.quantity * order.price))/totalQuantity
            let position = openPositions[openPositions.indexOf(coinPosition[0])]

            position.quantity = totalQuantity
            position.averagePrice = averagePrice
        }

    } else if(order.type === "Sell") {
        if(coinPosition.length === 0) {
            console.log("error: you can't sell a coin which you don't already own.")

        } else if(coinPosition.length > 0) {
            let position = openPositions[openPositions.indexOf(coinPosition[0])]
            if(order.quantity === position.quantity){
                // Transaction resulted in all owned coins being sold
                openPositions = openPositions.filter(item => item != position)

            } else if(order.quantity > 0 && order.quantity < position.quantity) {
                // Sale quantity was less than the total number of coins on hand
                position.quantity -= order.quantity
            }
        }
    }

    // Update local storage data store to reflect the changes of the transaction
    localStorage.setItem('openPositions', JSON.stringify(openPositions))
}

const updateOrderHistory = (order) => {
    let orderHistory = JSON.parse(localStorage.getItem('orderHistory'))
    orderHistory.push(order)
    localStorage.setItem('orderHistory', JSON.stringify(orderHistory))
}

const executeOrder = (type, coin, qty, price) => {
    console.log(type, coin, qty, price)
    const order = {
        type: type,
        coin: coin,
        quantity: qty,
        price: price
    }

    // Adjust cash balance
    if( type === "Buy" )  adjustCashBalance(-( qty * price ))
    if( type === "Sell" ) adjustCashBalance( ( qty * price ))

    // Update open positions
    adjustOpenPositions( order )

    // Enter order to orderHistory
    updateOrderHistory( order )

    // Update Portfolio to reflect changes
    renderPortfolio()

    // Update order form info to reflect changes
    updateOrderFormInfo()

    let alertMessage = `<em>Order Executed</em>: <b>${type} ${qty} ${coin} for $${qty * price} (${CurrencyPreference})</b>`
    let alertColourScheme = (type === "Buy") ? 'alert-success' : 'alert-danger'
    buildAlert(alertMessage, alertColourScheme)
}

// Manage user preferences
// Set initial state if not already set
const setInitialPreferences = () => {
    if(!localStorage.getItem("userPreferences")){
        let title = "Account Setup"
        let content = `
            <div>Welcome to CryptEx. Please set up your account preferences.</div>
            <div class="d-flex flex-row px-4">
                <label for="pref-currency">Currency</label>
                <select id="pref-currency" class="mx-2">
                    <option value="AUD">AUD</option>
                    <option value-"USD>USD</option>
                </select>
            </div>
        `
        let confirmBtnText = "Save Changes"

        // Hide close buttons to avoid user not selecting a currency preference
        document.getElementById("modal-close").style.display = "none"
        document.getElementById("modal-close-btn").style.display = "none"

        let action = () => {
            let currencyPreference = document.getElementById("pref-currency").value
            let preferences = {}
            preferences.currency = currencyPreference
            localStorage.setItem("userPreferences", JSON.stringify(preferences))
            updateGlobals()
            // Force refresh to ensure that initial data loads properly
            window.location.href = window.location.href
        }

        buildModal(title, content, confirmBtnText, action, backdrop = "static") 
        }
}

// document.getElementById('settings-btn').addEventListener('click', () => {
//     let title = "Settings"
//     let content = `
//         <div class="d-flex flex-row px-4">
//             <label for="pref-currency">Currency</label>
//             <select id="pref-currency" class="mx-2">
//                 <option value="AUD">AUD</option>
//                 <option value-"USD>USD</option>
//             </select>
//         </div>
//     `
//     let confirmBtnText = "Save Changes"

//     let action = () => {
//         let currencyPreference = document.getElementById("pref-currency").value
//         let preferences = JSON.parse(localStorage.getItem("userPreferences"))
//         preferences.currency = currencyPreference
//         localStorage.setItem("userPreferences", JSON.stringify(preferences))
//         updateGlobals()
//     }

//     buildModal(title, content, confirmBtnText, action) 
// })

// Function to update global data store variables
const updateGlobals = () => {
    UserPreferences = JSON.parse(localStorage.getItem("userPreferences"))
    CurrencyPreference = UserPreferences.currency
    CashBalance = JSON.parse(localStorage.getItem("cashBalance"))
    OpenPositions = JSON.parse(localStorage.getItem("openPositions"))
}

//-------------------------> END LOCALSTORAGE LOGIC

//-------------------------> START LIVE DATA LOGIC

// Set default coin list
let coinList = ["BTC", "ETH", "BNB", "ADA", "SOL", "XRP", "DOT", "LTC", "LINK", "UNI", "ALGO", "LUNA"];

let cryptoData = {
    BTC: "Bitcoin",
    ETH: "Ethereum",
    BNB: "Binance",
    ADA: "Cardano",
    SOL: "Solana",
    XRP: "XRP",
    DOT: "Polkadot",
    LTC: "Litecoin",
    LINK: "Chainlink",
    UNI: "Uniswap",
    ALGO: "Algorand",
    LUNA: "Terra Luna",
};

// Get data function - returns current crypto prices in user preferred currency
const getCryptoData = (coins = coinList) => {
    coins = coins.join(",");
    fetch(`https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${coins}&tsyms=AUD,USD`)
        .then(res => res.json())
        .then(data => {

            localStorage.setItem('currentPriceData', JSON.stringify(data))

            let changeColor;
            let tableOutputHTML = ``;

            // Loop over data and put in price table
            for (let [code, coinData] of Object.entries(data.RAW)) {
                coinData = coinData[CurrencyPreference];
                if (coinData.CHANGEPCT24HOUR >= 0) {
                    changeColor = "text-success";
                } else {
                    changeColor = "text-danger";
                }
                tableOutputHTML += `
                  <tr scope="row" id="coin-${code}">
                      <td class="td-name"><img src="./images/icon-svg/${code.toLowerCase()}.svg" alt="${code}"><span class="name px-2">${
                    cryptoData[code]
                }</span><span class="code pe-2">${code}</span></td>
                      <td class="td-price">$ ${Math.round(10000 * coinData.PRICE) / 10000}</td>
                      <td class="td-mcap d-none d-md-table-cell">$ ${Math.round(coinData.MKTCAP)}</td>
                      <td class="td-change ${changeColor}">${Math.round(100 * coinData.CHANGEPCT24HOUR) / 100}%</td>
                  </tr>
              `;
            }

            document.getElementById("coin-data-table").innerHTML = tableOutputHTML;

            setRowEventListeners();
        })
        .catch(error => {
            console.error(error);
        });
};

//-------------------------> END LIVE DATA LOGIC

//-------------------------> TRADE LOGIC

// Create select list for trade page
let coinSelectHTML = ``;
// Loop over data and put in price table
for (const [code, name] of Object.entries(cryptoData)) {
    coinSelectHTML += `
        <option value="${code}">${name}</option>
    `;
}
let coinSelect = document.getElementById("coin")
coinSelect.innerHTML += coinSelectHTML;

const updateOrderFormInfo = () => {
    let coinCode = coinSelect.value
    let orderCoinElem = document.getElementById("order-coin")
    let orderPriceElem = document.getElementById("order-price")
    let orderCashBalanceElem = document.getElementById("order-cash-balance")
    let orderCoinBalanceElem = document.getElementById("order-coin-balance")
    let buySellMaxElem = document.getElementById("buy-sell-max")
        
    if(coinList.includes(coinCode)){
        let orderCoin = cryptoData[coinCode]
        let orderPrice = Math.round(JSON.parse(localStorage.getItem('currentPriceData')).RAW[coinCode][CurrencyPreference].PRICE*100)/100
        let orderCashBalance = Math.round(JSON.parse(localStorage.getItem('cashBalance'))*100)/100
        let orderCoinBalance = JSON.parse(localStorage.getItem('openPositions')).find(position => position.coin == coinCode)

        orderCoinElem.innerHTML = `${orderCoin} (${coinCode})`
        orderPriceElem.innerHTML = `Current Price: $${orderPrice}`
        orderCashBalanceElem.innerHTML = `Cash Balance: $${orderCashBalance}`
        if (orderCoinBalance){
            orderCoinBalanceElem.innerHTML = `Coin Balance: ${orderCoinBalance.quantity} ${coinCode}`
        } else {
            orderCoinBalanceElem.innerHTML = `Coin Balance: 0 ${coinCode}`
        }
        buySellMaxElem.style.visibility = "visible"
    } else {
        orderCoinElem.innerHTML = ""
        orderPriceElem.innerHTML = ""
        orderCashBalanceElem.innerHTML = ""
        orderCoinBalanceElem.innerHTML = ""
        buySellMaxElem.style.visibility = "hidden"
    }
}

// Buy max logic
document.getElementById("buy-max").addEventListener('click', () => {
    let orderPrice = JSON.parse(localStorage.getItem('currentPriceData')).RAW[coinSelect.value][CurrencyPreference].PRICE
    let orderCashBalance = JSON.parse(localStorage.getItem('cashBalance'))
    let maxQuantity = Math.round((orderCashBalance/orderPrice)*100000)/100000
    document.getElementById("quantity").value = maxQuantity
})

// Sell max logic
document.getElementById("sell-max").addEventListener('click', () => {
    let orderCoinPosition = JSON.parse(localStorage.getItem('openPositions')).find(position => position.coin == coinSelect.value)
    let maxQuantity

    if(orderCoinPosition){
        maxQuantity = orderCoinPosition.quantity
    } else {
        maxQuantity = 0
    }

    document.getElementById("quantity").value = maxQuantity
})

// Set account info data when coin selected
coinSelect.addEventListener('change', () => {
    updateOrderFormInfo()
})

// Function to set clicked coin's name to trade form and show trade form
let goToTrade = coinCode => {
    // Set nav link to trade page
    document.getElementById("trade-link").click();
    // Set crypto select to clicked crypto
    document.getElementById("coin").value = coinCode;
    updateOrderFormInfo()
};

// Set click event listeners on table rows to populate trade form and "redirect"
const setRowEventListeners = () => {
    let tableRows = document.getElementsByTagName("tr");
    for (row of tableRows) {
        // Get coin code from row
        let code = row.id.split("-")[1];
        row.addEventListener("click", () => {
            goToTrade(code);
        });
    }
};
setRowEventListeners(); // Call once to set links on first load

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
let orderType = document.getElementById("order-type-select");
orderType.addEventListener("change", showLimitPrice);
showLimitPrice();

//--------------------------> BUY/SELL LOGIC

const orderFormValid = (form) => {
    // Validity checks
    let validForm = true

    if(!["market", "limit"].includes(form['order-type'].value)) validForm = validForm && false
    if(!coinList.includes(form["coin"].value)) validForm = validForm && false
    if(!form.quantity.checkValidity() || form.quantity.value <= 0) validForm = validForm && false
    if(form['order-type'].value === 'limit') {
        // A limit price must be present
        if(form['limit-price'].value <= 0 || !form['limit-price'].checkValidity()) validForm = validForm && false
    }
    if(!validForm){
        document.getElementById("order-form-error").innerHTML = "Invalid order: try again"
    }

    return validForm
}

// Clear warnings on new input
document.getElementById("order-form").addEventListener('input', () => {
    document.getElementById("order-form-error").innerHTML = ""
})

// Check that there are enough funds/coins for the order to execute
const isValidOrder = (e, form, price) => {

    let validOrder = true

    // Check to see if this is a buy or sell order
    if(e.target.value === 'Buy') {
        // Order value can't be more than cash balance
        let orderValue = Math.round((price * form.quantity.value)*100)/100
        if(orderValue > CashBalance){
            validOrder = validOrder && false
            document.getElementById("order-form-error").innerHTML = "Invalid Order: Order value can not exceed your current cash balance"
        }
    } else if(e.target.value === 'Sell') {
        // Order quantity can't be more than the number of coins owned
        let currentPosition = OpenPositions.filter(position => position.coin === form.coin.value)[0]
        if(!currentPosition || form.quantity.value > currentPosition.quantity){
            validOrder = validOrder && false
            document.getElementById("order-form-error").innerHTML = `Invalid Order: Order quantity can not exceed your current ${form.coin.value} balance`
        }
    }
   
    return validOrder
}

const submitOrder = (e) => {
    let form = document.getElementById("order-form");
    if(!orderFormValid(form)) return

    let currentCoinData = JSON.parse(localStorage.getItem('currentPriceData')).RAW[form.coin.value][CurrencyPreference]
    let coinPrice = Math.round(currentCoinData.PRICE*100)/100
    let tradePair = `${CurrencyPreference}/${form.coin.value}`
    let tradeQuantity = form.quantity.value
    let orderValue = Math.round((coinPrice * form.quantity.value)*100)/100
    let tradeFee = Math.round(orderValue)/100
    let tradeTotal = Math.round((orderValue + tradeFee)*100)/100 // This needs to be modified to check if cash balance can cover trade + fees, else trade - fees

    if(isValidOrder(event, form, coinPrice)) {
        let title = "Confirm Market Order"
        let content = `
            <div class="row d-flex flex-row justify-content-end px-5">
                <div class="col-xs-10 col-sm-8 py-3">
                    <div class="row">
                        <div class="col-7">Price (${tradePair})</div><div class="col-5 text-end">$${coinPrice}</div>
                    </div>
                    <div class="row">
                        <div class="col-7">Quantity</div><div class="col-5 text-end">${tradeQuantity}</div>
                    </div>
                    <div class="row">
                        <div class="col-7">Est. Order Value</div><div class="col-5 text-end">$${orderValue}</div>
                    </div>
                    <!-- <div class="row">
                        <div class="col-7">Trade Fee</div><div class="col-5 text-end">${tradeFee}</div>
                    </div>
                    <div class="row">
                        <div class="col-7">Est.Total (inc. fees)</div><div class="col-5 text-end"><b>${tradeTotal}</b></div>
                    </div> -->                  
                </div>
            </div>
        `
        let confirmBtnText = "Execute Order"

        let action = () => {
            executeOrder(e.target.value, form.coin.value, Number(form.quantity.value), coinPrice)
        }

        buildModal(title, content, confirmBtnText, action)
    }
}

document.getElementById("buy-button").addEventListener("click", (e) => {
    submitOrder(e)
    
});

document.getElementById("sell-button").addEventListener("click", (e) => {
    submitOrder(e)
});



//--------------------------> PORTFOLIO LOGIC

// Renderer to build portfolio table
const renderPortfolio = () => {
    // Get local storage data
    const openPositions = JSON.parse(localStorage.getItem("openPositions"))
    const currentPrices = JSON.parse(localStorage.getItem("currentPriceData")).RAW
    const cashBalance = Math.round(JSON.parse(localStorage.getItem("cashBalance") * 100))/100
    let portfolioValue = 0
    let positionRow = ``

    for(let position of openPositions) {
        position.acquisitionValue = position.quantity * position.averagePrice
        position.currentCoinPrice = currentPrices[position.coin][CurrencyPreference].PRICE
        position.currentValue = Math.round(((position.quantity * position.currentCoinPrice)*100))/100
        position.profitLoss = Math.round((((position.currentValue - position.acquisitionValue)/position.acquisitionValue)*10000))/100
        portfolioValue += position.currentValue
        
        let plColour
        if(position.profitLoss >= 0){
            plColour = "text-success"
        } else {
            plColour = "text-danger"
        }
    
        positionRow += `
            <tr id="portfolio-${position.coin}">
                <td><img src="./images/${position.coin.toLowerCase()}.svg" alt="${position.coin}" /> ${cryptoData[position.coin]} ${position.coin}</td>
                <td class="d-none d-sm-table-cell">${position.quantity}</td>
                <td class="d-none d-md-table-cell">$${Math.round((position.averagePrice * 100000))/100000}</td>
                <td class="${plColour}">${position.profitLoss}%</td>
                <td>$${position.currentValue}</td>
            </tr>
        `
    }

    portfolioValue = Math.round((portfolioValue*100))/100

    document.getElementById("cash-on-hand").innerHTML = "Cash on Hand: $" + cashBalance
    document.getElementById("portfolio-value").innerHTML = "Portfolio Value: $" + portfolioValue
    document.getElementById('portfolio-detail').innerHTML = positionRow
}

//--------------------------> MODAL TEMPLATES


// Function to insert content into modal model
const buildModal = (title, content, confirmBtnText, action, backdrop = true, keyboard = false) => {
    // Set up modal element as BS modal - Using this approach allows manual
    // triggering of show and hide events
    let modalController = new bootstrap.Modal(document.getElementById("modal"), {backdrop: backdrop, keyboard: keyboard})

    modalController.show()

    let modalTitle = document.getElementsByClassName("modal-title")[0]
    let modalContent = document.getElementsByClassName('modal-body')[0]
    let modalConfirm = document.getElementById('modal-confirm')

    modalTitle.innerHTML = title
    modalContent.innerHTML = content
    modalConfirm.innerHTML = confirmBtnText

    modalConfirm.addEventListener('click', () => {
        action()
        modalController.hide()
    })
}

// Reset modal on close
let modal = document.getElementById('modal')
modal.addEventListener('hidden.bs.modal', (event) => {
    let modal = document.getElementById("modal")
    let modalTitle = document.getElementsByClassName("modal-title")[0]
    let modalContent = document.getElementsByClassName('modal-body')[0]
    let modalConfirm = document.getElementById('modal-confirm')
    let modalClose = document.getElementById("modal-close")
    let modalCloseBtn = document.getElementById("modal-close-btn")

    modalTitle.innerHTML = ""
    modalContent.innerHTML = ""
    modalConfirm.innerHTML = ""

    // Reset confirm button to destroy event listeners
    modalConfirm.outerHTML = modalConfirm.outerHTML

    // Reset diplay properties for modal close buttons
    modalClose.style.display = "inline-block"
    modalCloseBtn.style.display = "inline-block"
    modal.removeAttribute("data-backdrop")
})


//--------------------------> ALERT TEMPLATES
const buildAlert = (alertContent, colourScheme = 'alert-primary') => {
    let alertElement = document.getElementById('alert')
    alertElement.style.display = 'block'
    alertElement.innerHTML = alertContent
    alertElement.classList.add(colourScheme)

    // Remove and clear alert after 10 seconds
    setTimeout(() => {
        alertElement.style.display = "none"
        alertElement.innerHTML = ``
        alertElement.classList.remove(colourScheme)
    }, 10000)
}


// Run on page load
window.onload = loadSVGLine;
setInitialPreferences()
getCryptoData()
updateGlobals()
renderPortfolio()
updateOrderFormInfo()

const updateData = setInterval(() => {
    getCryptoData();
    updateGlobals()
    // Update portfolio page with new data
    renderPortfolio()
    // Update trade page balance/price info
    updateOrderFormInfo()
}, 5000);