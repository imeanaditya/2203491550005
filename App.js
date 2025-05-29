import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar,
} from "recharts";

import {
  Container,
  TextField,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  Typography,
  Box,
  Paper,
  CircularProgress,
} from "@mui/material";

const API_KEY = "YOUR_ALPHA_VANTAGE_API_KEY";

const chartTypes = ["line", "area", "bar"];
const dateRanges = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

function App() {
  const [symbol, setSymbol] = useState("AAPL");
  const [stockData, setStockData] = useState(null);
  const [chartType, setChartType] = useState("line");
  const [dateRange, setDateRange] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    fetchStockData(symbol);
  }, []);

  const fetchStockData = async (symbolToFetch) => {
    setLoading(true);
    setError(null);
    setStockData(null);

    try {
      const response = await axios.get("https://www.alphavantage.co/query", {
        params: {
          function: "TIME_SERIES_DAILY",
          symbol: symbolToFetch,
          apikey: API_KEY,
        },
      });

      const timeSeries = response.data["Time Series (Daily)"];
      if (!timeSeries) {
        setError("Invalid symbol or API limit reached.");
        setLoading(false);
        return;
      }

      let data = Object.entries(timeSeries).map(([date, values]) => ({
        date,
        open: parseFloat(values["1. open"]),
        high: parseFloat(values["2. high"]),
        low: parseFloat(values["3. low"]),
        close: parseFloat(values["4. close"]),
        volume: parseInt(values["5. volume"], 10),
      }));

      data.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Filter by date range
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - dateRange);
      data = data.filter((d) => new Date(d.date) >= cutoffDate);

      setStockData(data);
    } catch (e) {
      setError("Failed to fetch data.");
    }
    setLoading(false);
  };

  const renderChart = () => {
    if (!stockData) return null;

    const commonProps = {
      data: stockData,
      margin: { top: 10, right: 30, left: 0, bottom: 5 },
    };

    switch (chartType) {
      case "line":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={(tick) => tick.slice(5)} />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="close" stroke="#1976d2" dot={false} />
          </LineChart>
        );
      case "area":
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1976d2" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#1976d2" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tickFormatter={(tick) => tick.slice(5)} />
            <YAxis />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="close"
              stroke="#1976d2"
              fillOpacity={1}
              fill="url(#colorClose)"
            />
          </AreaChart>
        );
      case "bar":
        return (
          <BarChart {...commonProps}>
            <XAxis dataKey="date" tickFormatter={(tick) => tick.slice(5)} />
            <YAxis />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip />
            <Bar dataKey="close" fill="#1976d2" />
          </BarChart>
        );
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        bgcolor: darkMode ? "#121212" : "#fafafa",
        minHeight: "100vh",
        color: darkMode ? "#eee" : "#222",
        p: 3,
      }}
    >
      <Container maxWidth="md" component={Paper} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Stock Aggregation App
        </Typography>

        <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
          <TextField
            label="Stock Symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            sx={{ flex: "1 1 150px" }}
          />
          <Button
            variant="contained"
            onClick={() => fetchStockData(symbol)}
            sx={{ flex: "0 0 auto" }}
          >
            Search
          </Button>

          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={(_, val) => val && setChartType(val)}
            aria-label="chart type"
            sx={{ flex: "0 0 auto" }}
          >
            {chartTypes.map((type) => (
              <ToggleButton key={type} value={type} aria-label={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Date Range</InputLabel>
            <Select
              value={dateRange}
              label="Date Range"
              onChange={(e) => setDateRange(e.target.value)}
            >
              {dateRanges.map(({ label, value }) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ ml: "auto", display: "flex", alignItems: "center" }}>
            <Typography>Dark Mode</Typography>
            <Switch
              checked={darkMode}
              onChange={() => setDarkMode(!darkMode)}
              color="primary"
            />
          </Box>
        </Box>

        {loading && (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Typography color="error" variant="body1" textAlign="center" mb={2}>
            {error}
          </Typography>
        )}

        {stockData && (
          <ResponsiveContainer width="100%" height={400}>
            {renderChart()}
          </ResponsiveContainer>
        )}

        {/* Extra info */}
        {stockData && stockData.length > 0 && (
          <Box mt={3}>
            <Typography variant="h6" gutterBottom>
              Latest Data ({stockData[stockData.length - 1].date})
            </Typography>
            <Typography>
              Open: {stockData[stockData.length - 1].open}
            </Typography>
            <Typography>
              High: {stockData[stockData.length - 1].high}
            </Typography>
            <Typography>
              Low: {stockData[stockData.length - 1].low}
            </Typography>
            <Typography>
              Close: {stockData[stockData.length - 1].close}
            </Typography>
            <Typography>
              Volume: {stockData[stockData.length - 1].volume.toLocaleString()}
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
}

export default App;
