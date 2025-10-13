# React Financial Charts

> **Note:** this repo is a fork of [react-financial-charts](https://github.com/react-financial/react-financial-charts), renamed, converted to single repo, and updated to support React 19. This is in no way intended to be a maintained version, but if you find it useful, good luck!

## Features

- integrates multiple chart types
- technical indicators and overlays
- drawing objects

### Chart types

- Scatter
- Area
- Line
- Candlestick
- OHLC
- HeikenAshi
- Renko
- Kagi
- Point & Figure

### Indicators

- EMA, SMA, WMA, TMA
- Bollinger band
- SAR
- MACD
- RSI
- ATR
- Stochastic (fast, slow, full)
- ForceIndex
- ElderRay
- Elder Impulse

### Interactive Indicators

- Trendline
- Fibonacci Retracements
- Gann Fan
- Channel
- Linear regression channel

---

## Installation

```sh
pnpm install @slowclap/financial-charts
```

## Documentation

Current documentation is limited to examples. These can be run by downloading and installing dependencies, then 
doing the same for the `examples/` folder.
```sh
pnpm install
pnpm run build
(cd examples && pnpm install)
pnpm storybook
```

## Contributing

Use, copy, or modify on your own. This was intended as a one-off for my specific needs. Not accepting contributions
at this time.