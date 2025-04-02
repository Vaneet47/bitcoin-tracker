import React, { useEffect, useRef, useState } from 'react';
import { AreaSeries, createChart, HistogramSeries } from 'lightweight-charts';
import Circle from '../assets/plus-circle.svg?react';
import Maximize from '../assets/maximize-2.svg?react';
import './BitcoinTracker.css';
import axios from 'axios';

const menu = ['Summary', 'Chart', 'Statistics', 'Analysis', 'Settings'];

const intervalColor = '#4B40EE';
const INITIAL_WIDTH = 1000;
const INITIAL_HEIGHT = 343;

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
  const [areaSeries, setAreaSeries] = useState(null);
  const [volumeSeries, setVolumeSeries] = useState(null);
  const [activeInterval, setActiveInterval] = useState('1d');
  const [currentPrice, setCurrentPrice] = useState('');
  const [priceChange, setPriceChange] = useState('');
  const [error, setError] = useState('');

  const [seriesData, setSeriesData] = useState(new Map());

  const getData = async () => {
    try {
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
      const priceCh = `${
        percentChange > 0
          ? `+${absoluteChange.toFixed(2)}`
          : absoluteChange.toFixed(2)
      } (${percentChange.toFixed(2)}%)`;
      setPriceChange(priceCh);
    } catch (error) {
      console.log(error);
      setError(
        `Too many requests to get current price. Please reload after ~1 minute`
      );
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const getGraphData = async (interval) => {
    const days = daysConversion[interval];
    try {
      const response = await axios.get(`${INTERVAL_DATA_URL}&days=${days}
      `);
      const formattedData = response.data.prices.map(
        ([timestamp, price], index) => ({
          time: Math.floor(timestamp / 1000),
          value: price,
          volume: response.data.total_volumes[index][1],
        })
      );
      setSeriesData((prevMap) => {
        const newMap = new Map(prevMap);
        newMap.set(interval, formattedData);
        return newMap;
      });
      setError('');
      return formattedData;
    } catch (error) {
      console.log(error);
      if (interval === '1d') {
        setError(`Too many requests. Please reload after ~1 minute`);
      } else
        setError(
          `Too many requests! Please wait a minute and try again to load the ${interval} data.`
        );
    }
  };

  useEffect(() => {
    if (!chart) return;

    const resizeChart = () => {
      if (chartContainerRef.current && chart) {
        const newWidth = document.fullscreenElement
          ? window.innerWidth
          : INITIAL_WIDTH;
        const newHeight = document.fullscreenElement
          ? window.innerHeight
          : INITIAL_HEIGHT;
        chart.applyOptions({ width: newWidth, height: newHeight });
      }
    };
    const handleFullscreenChange = () => {
      resizeChart();
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [chart]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const newChart = createChart(chartContainerRef.current, {
      layout: {
        textColor: 'transparent',
        background: { type: 'solid', color: 'white' },
      },
      rightPriceScale: {
        borderColor: 'lightgrey',
      },
      timeScale: {
        borderColor: 'lightgrey',
      },
      leftPriceScale: {
        visible: true,
        borderColor: 'lightgrey',
      },
      height: INITIAL_HEIGHT,
      width: INITIAL_WIDTH,
    });
    const newAreaSeries = newChart.addSeries(AreaSeries, {
      title: 'Price',
      topColor: 'rgba(127, 119, 235, 0.5)',
      bottomColor: 'rgba(246, 246, 246, 0)',
      lineColor: '#4B40EE',
      lineWidth: 2,
    });
    const newVolumeSeries = newChart.addSeries(HistogramSeries, {
      title: 'Volume',
      color: 'rgb(211,211,211,0.8)',
      priceLineVisible: true,
      priceFormat: { type: 'volume' },
      priceScaleId: 'left',
    });
    const setupChart = async () => {
      if (seriesData.has('1d')) {
        newAreaSeries.setData(
          seriesData.get('1d').map(({ time, value }) => ({ time, value }))
        );
        newVolumeSeries.setData(
          seriesData
            .get('1d')
            .map(({ time, volume }) => ({ time, value: volume }))
        );
      } else {
        const data = await getGraphData('1d');
        newAreaSeries.setData(data.map(({ time, value }) => ({ time, value })));
        newVolumeSeries.setData(
          data.map(({ time, volume }) => ({ time, value: volume }))
        );
      }

      setChart(newChart);
      setAreaSeries(newAreaSeries);
      setVolumeSeries(newVolumeSeries);
    };

    setupChart();

    return () => newChart.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setChartInterval = async (interval) => {
    if (!areaSeries || !volumeSeries) return;
    setActiveInterval(interval);

    if (seriesData.has(interval)) {
      areaSeries.setData(
        seriesData.get(interval).map(({ time, value }) => ({ time, value }))
      );
      volumeSeries.setData(
        seriesData
          .get(interval)
          .map(({ time, volume }) => ({ time, value: volume }))
      );
    } else {
      const data = await getGraphData(interval);
      areaSeries.setData(data.map(({ time, value }) => ({ time, value })));
      volumeSeries.setData(
        data.map(({ time, volume }) => ({ time, value: volume }))
      );
    }

    areaSeries.applyOptions({ color: intervalColor });
    chart.timeScale().fitContent();
  };

  const toggleFullscreen = () => {
    chartContainerRef.current
      .requestFullscreen()
      .then(() => {})
      .catch((err) => {
        console.error('Error attempting to enable fullscreen', err);
      });
  };

  return (
    <div>
      {currentPrice && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}
          >
            <span className='price-current'>{currentPrice}</span>
            <span className='price-currency'>USD</span>
          </div>
          <span
            className='price-change'
            style={{ color: priceChange[0] === '-' ? 'red' : '#67bf6b' }}
          >
            {priceChange}
          </span>
        </div>
      )}
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
        <button
          key='Fullscreen'
          className='button-fullscreen'
          onClick={toggleFullscreen}
        >
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
