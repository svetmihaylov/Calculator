# Results Predictor

Results Predictor is a lightweight, browser-based email campaign calculator. It helps campaign planners estimate customer growth, revenue, operating expenses, profit, retention, and return on investment across a selectable timeline.

The project is intentionally simple: it uses plain HTML, CSS, and JavaScript with no framework, package manager, build step, or backend. Open it locally and the calculator is ready to use.

## Purpose

The calculator provides a quick scenario-planning tool for campaigns. Users can change campaign assumptions with sliders and immediately see:

- A profit trend chart.
- First-period profit.
- Customers at the end of the selected timeline.
- Total revenue.
- Total expenses.
- Total profit.
- Average retention.
- Return on investment.

It is designed for interactive estimation rather than accounting, billing, or financial reporting. The exchange rates and campaign model are illustrative and should be replaced with verified business data before production use.

## Features

### Campaign controls

- **Language:** English, Spanish, or French.
- **Time unit:** Day, week, or month.
- **Number of periods:** 1 to 24 periods.
- **Currency:** USD, EUR, or GBP.

### Revenue assumptions

- Launching customers.
- Revenue per conversion.
- Customer growth rate.
- Average response rate.

### Expense assumptions

- Customer churn rate.
- Variable cost per customer.
- Fixed costs.
- Starting cost.

Every slider updates its visible value, the summary metrics, and the chart immediately.

### Data actions

- **Export Data** downloads the current calculator state and selected display settings as `results-predictor-data.json`.
- **Load Data** accepts a JSON file exported by the calculator and restores the sliders, language, time unit, period count, and currency.

### Visualization

The chart is drawn with the native HTML Canvas API. It displays profit by period with:

- Horizontal and vertical grid lines.
- A connected profit line.
- Profit data points.
- Localized time-unit labels.
- A safe single-period layout so the graph remains visible when only one period is selected.

## Calculation model

The calculator normalizes the selected time unit to weeks:

| Time unit | Weeks per period |
| --- | ---: |
| Day | `1 / 7` |
| Week | `1` |
| Month | `52 / 12` |

For each period, the calculator estimates:

```text
customers = launchingCustomers * (1 + customerGrowthRate) ^ (period * weeksPerPeriod)

revenue = customers * averageResponseRate * revenuePerConversion * weeksPerPeriod

operatingCosts = (fixedCosts + customers * variableCost) * weeksPerPeriod

startingCost = startingCost for period 1, otherwise 0

expenses = operatingCosts + startingCost

profit = revenue - expenses
```

The summary then aggregates the period series:

```text
totalRevenue = sum(period.revenue)
totalExpenses = sum(period.expenses)
totalProfit = totalRevenue - totalExpenses

retention = (1 - customerChurnRate) ^ (periods * weeksPerPeriod)

ROI = totalProfit / max(1, totalExpenses) * 100
```

Customers in the summary are rounded from the final period. Money values are converted for display using the selected currency.

## Default values

| Input | Default | Range / options |
| --- | ---: | --- |
| Launching customers | `119` | `0` to `500` |
| Revenue per conversion | `119` | `0` to `1000` |
| Customer growth rate | `0.15` | `0` to `1`, step `0.01` |
| Average response rate | `0.20` | `0` to `1`, step `0.01` |
| Customer churn rate | `0.02` | `0` to `0.5`, step `0.01` |
| Variable cost | `10.8` | `0` to `30`, step `0.1` |
| Fixed costs | `175` | `0` to `1000` |
| Starting cost | `0` | `0` to `1000` |
| Number of periods | `12` | `1` to `24` |
| Time unit | Week | Day, Week, Month |
| Currency | USD | USD, EUR, GBP |

## Currency handling

The current display conversion uses fixed illustrative rates defined in `script.js`:

```js
const currencyRates = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79
};
```

Values are calculated in the base model and converted only when formatted for display. These rates are not live market rates.

## Localization

Translations are stored in separate language files under `lang/`:

- `lang/en.js` - English.
- `lang/es.js` - Spanish.
- `lang/fr.js` - French.

Elements with a `data-i18n` attribute are translated by `applyTranslations()`. Dynamic summary labels and chart axis labels are regenerated when the language changes so they continue to reflect the selected time unit and period count.

## Project structure

```text
Calculator/
|-- index.html       Main application markup and controls
|-- script.js        State, calculations, events, chart, import, and export logic
|-- style.css        Layout, responsive styling, controls, chart container, and theme
|-- lang/
    |-- en.js        English translation pack
    |-- es.js        Spanish translation pack
    |-- fr.js        French translation pack
|-- README.md        Project documentation
```

## How to run

### Direct file opening

Because this is a static project, open `index.html` directly in a modern browser.

### Local development server

A local server is useful when testing browser download and file-upload behavior:

```powershell
cd "C:\path\to\Calculator"
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

No installation step is required. The project does not currently use npm, Node.js, a bundler, or a framework.

## How the code is organized

### `index.html`

Defines the application shell:

- Left sidebar for language, timeline, periods, and currency.
- Main panel for the Canvas chart and assumption sliders.
- Right summary panel for calculated results and data actions.
- Script loading order for the three translation packs and `script.js`.

### `script.js`

Owns application behavior:

- Keeps the current numeric assumptions in the `state` object.
- Connects DOM controls to event handlers.
- Calculates normalized period data in `calculateSalesSeries()`.
- Updates the summary in `updateSummary()`.
- Draws the chart in `renderChart()`.
- Formats currency and percentages.
- Applies translations.
- Exports and validates imported JSON data.

### `style.css`

Defines the visual system and responsive layout:

- Soft blue-gray background with a white translucent application shell.
- Three-column desktop layout.
- Stacked layout below `1100px`.
- Single-column slider cards below `700px`.
- Gradient controls, metric cards, summary rows, and chart framing.
- CSS custom properties for the main colors and spacing relationships.

## JSON data format

Exported files use this shape:

```json
{
  "state": {
    "launchingCustomers": 119,
    "revenuePerConversion": 119,
    "customerGrowthRate": 0.15,
    "averageResponseRate": 0.2,
    "customerChurnRate": 0.02,
    "variableCost": 10.8,
    "fixedCosts": 175,
    "startingCost": 0
  },
  "settings": {
    "language": "en",
    "timeUnit": "week",
    "periods": "12",
    "currency": "USD"
  }
}
```

When loading a file, the application checks that all expected state values are numeric and that settings use supported options. Period counts are clamped to the supported range of 1 to 24.

## Design direction

The interface is designed as a focused campaign-planning dashboard rather than a marketing landing page:

- The left panel keeps scenario controls close at hand.
- The center panel emphasizes trend discovery through the chart and grouped assumptions.
- The right panel keeps decision-ready totals visible while users experiment.
- Muted surfaces and restrained borders keep the dense data readable.
- Teal and blue accents distinguish actions, profit, and chart elements without overwhelming the numeric content.
- Responsive breakpoints preserve the same workflow on tablets and smaller screens.

## Browser compatibility

The project relies on standard browser features:

- ES2020-style JavaScript syntax, including optional chaining.
- HTML Canvas 2D.
- `Intl.NumberFormat` for currency output.
- `Blob`, object URLs, and the File API for export/import.

Use a current version of Chrome, Edge, Firefox, or Safari.

## Validation checklist

Before committing changes, verify:

- The page loads without console errors.
- All eight sliders update their readouts and summary values.
- Day, week, and month calculations update labels and chart points.
- Period counts from `1` through `24` render correctly.
- Currency changes update every money value.
- All three languages update static labels and dynamic period labels.
- The chart remains visible with one period and with the default twelve periods.
- Export creates a JSON file.
- Loading a valid exported JSON file restores the scenario.
- Invalid JSON shows an error message without breaking the calculator.
- The layout remains usable at desktop, tablet, and mobile widths.

## Current limitations

- Currency rates are fixed examples, not live exchange rates.
- The chart plots base model profit values and does not draw currency symbols on the axis.
- The `Learn more` campaign widget button is currently a visual placeholder because no destination URL or campaign integration is configured.
- Some expense labels in the markup are still plain text instead of translation keys and can be localized further if full language coverage is required.

## License

No license file is currently included. Add a license before distributing the project publicly.
