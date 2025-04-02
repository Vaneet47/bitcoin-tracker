import React, { useEffect, useRef, useState } from 'react';
import { createChart, LineSeries } from 'lightweight-charts';
import Circle from '../assets/plus-circle.svg?react';
import Maximize from '../assets/maximize-2.svg?react';
import './BitcoinTracker.css';
import axios from 'axios';

const menu = ['Summary', 'Chart', 'Statistics', 'Analysis', 'Settings'];

const intervalColor = '#4B40EE';

const CURRENT_PRICE_URL = 'https://api.coingecko.com/api/v3/simple/price';
const INTERVAL_DATA_URL =
  'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd';

const daysConversion = {
  '1d': 1,
  '3d': 3,
  '1w': 7,
  '1m': 30,
  '6m': 180,
  '1y': 365,
};

const BitcoinTracker = () => {
  const chartContainerRef = useRef(null);
  const [chart, setChart] = useState(null);
  const [lineSeries, setLineSeries] = useState(null);
  const [activeInterval, setActiveInterval] = useState('1d');
  const [currentPrice, setCurrentPrice] = useState('');
  const [priceChange, setPriceChange] = useState('');
  const [error, setError] = useState('');

  const [seriesData, setSeriesData] = useState(new Map());

  const getData = async () => {
    const response = await axios.get(CURRENT_PRICE_URL, {
      params: {
        ids: 'bitcoin',
        vs_currencies: 'usd',
        include_24hr_change: 'true',
      },
    });
    const data = response.data.bitcoin;
    const percentChange = data.usd_24h_change;
    const curee = data.usd;
    setCurrentPrice(data.usd);
    let previousPrice = curee / (1 + percentChange / 100);
    let absoluteChange = curee - previousPrice;
    const priceCh = `${percentChange > 0 ? '+' : '-'}${absoluteChange.toFixed(
      2
    )} (${percentChange.toFixed(2)}%)`;
    setPriceChange(priceCh);
  };

  useEffect(() => {
    getData();
  }, []);

  const getGraphData = async (interval) => {
    const days = daysConversion[interval];
    try {
      const response = await axios.get(`${INTERVAL_DATA_URL}&days=${days}
      `);
      const formattedData = response.data.prices.map(([timestamp, price]) => ({
        time: Math.floor(timestamp / 1000),
        value: price,
      }));
      setSeriesData((prevMap) => {
        const newMap = new Map(prevMap);
        newMap.set(interval, formattedData);
        return newMap;
      });
      setError('');
      return formattedData;
    } catch (error) {
      console.log(error);
      setError(
        `Too many requests. Please try again after ~1 minute for ${interval} data`
      );
    }
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const newChart = createChart(chartContainerRef.current, {
      layout: {
        textColor: 'transparent',
        background: { type: 'solid', color: 'white' },
      },
      height: 343,
      width: 839,
    });
    const newLineSeries = newChart.addSeries(LineSeries, {
      color: intervalColor,
    });
    const setupChart = async () => {
      if (seriesData.has('1d')) {
        newLineSeries.setData(seriesData.get('1d'));
      } else {
        const data = await getGraphData('1d');
        newLineSeries.setData(data);
      }

      setChart(newChart);
      setLineSeries(newLineSeries);
    };

    setupChart();

    return () => newChart.remove();
  }, []);

  const setChartInterval = async (interval) => {
    if (!lineSeries) return;
    setActiveInterval(interval);
    if (seriesData.has(interval)) {
      lineSeries.setData(seriesData.get(interval));
    } else {
      const data = await getGraphData(interval);
      lineSeries.setData(data);
    }
    lineSeries.applyOptions({ color: intervalColor });
    chart.timeScale().fitContent();
  };

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <span className='price-current'>{currentPrice}</span>
          <span className='price-currency'>USD</span>
        </div>
        <span className='price-change'>{priceChange}</span>
      </div>
      <div className='menu-container'>
        {menu.map((item, index) => (
          <p
            key={item}
            className='menu-item'
            style={{
              color: index === 1 ? '#1A243A' : '#6F7177',
              borderBottom: index === 1 ? '3px solid #4B40EE' : '',
            }}
          >
            {item}
          </p>
        ))}
      </div>
      <div
        className='buttons-container'
        style={{ display: 'flex', gap: '8px', marginTop: '40px' }}
      >
        <button key='Fullscreen' className='button-fullscreen'>
          <Maximize width={24} height={24} />
          Fullscreen
        </button>
        <button key='Compare' className='button-compare'>
          <Circle width={24} height={24} />
          Compare
        </button>
        {['1d', '3d', '1w', '1m', '6m', '1y'].map((interval) => (
          <button
            key={interval}
            onClick={() => setChartInterval(interval)}
            className='button-interval'
            style={{
              color: activeInterval === interval ? 'white' : '#6F7177',
              backgroundColor:
                activeInterval === interval ? intervalColor : 'transparent',
            }}
          >
            {interval}
          </button>
        ))}
      </div>
      {error && <span className='error-message'>{error}</span>}
      <div ref={chartContainerRef} style={{ marginTop: '60px' }} />
    </div>
  );
};

export default BitcoinTracker;
