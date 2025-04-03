# Bitcoin Price Tracker

![image](https://github.com/user-attachments/assets/064ee022-cad0-4a0a-a981-a42727dbff4d)

## Implementation Details:
### API Used:  
- Market chart data: [CoinGecko API](https://docs.coingecko.com/reference/coins-id-market-chart)
- Current price & 24-hour change: [CoinGecko API](https://docs.coingecko.com/reference/simple-price)  

### Key Features:
- Used lightweight-charts for graph visualization  
- Implemented options to switch between different timeframes: 1d, 3d, 1w, 1m, 6m, 1y
- Full-screen mode for an enhanced viewing experience  
- API rate limit handling: If too many requests are made in a short period, a ‘Too many requests’ message appears on the UI 
