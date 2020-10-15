import React, { useState, useEffect, useCallback } from 'react'

import Box from '@material-ui/core/Box'

import ToggleButton from '@material-ui/lab/ToggleButton'
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup'
import Toolbar from '@material-ui/core/Toolbar'

import BarChartIcon from '@material-ui/icons/BarChart'
import LineChartIcon from '@material-ui/icons/ShowChart'
import ShareChartIcon from '@material-ui/icons/ViewWeek'
import ValueChartIcon from '@material-ui/icons/Equalizer'
import StackedLineChartIcon from '@material-ui/icons/StackedLineChart'

import { useTheme } from '@material-ui/core/styles'

import { format } from 'date-fns'
import frLocale from "date-fns/locale/fr"


import deepmerge from 'deepmerge'

import loggerGenerator from './utils/logger'
const logger = loggerGenerator('error')

import { resolveObjectKeyChain } from './utils/data'

import { IntegerWithSelectField } from './IntegerWithSelectField'
import { SummaryTable } from './SummaryTable'

import { Tooltip as CustomTooltip } from './Tooltip'
import { Chart } from './Chart'

export const DataViz = ({
  dimensions,
  graphOptions,
  colors,
  timeAggregations,
  durationAmount,
  onDurationAmountChange,
  durationUnit,
  onDurationUnitChange,
  granularity,
  onGranularityChange,
  graphStack,
  onGraphStackChange,
  classes,
  dateFormatterGenerator,
  graphType,
  onGraphTypeChange,
  graphView: representationMode,
  onGraphViewChange: setRepresentationMode,
  smUpWidth,
  keys,
  dates: propDates,
  onDateDelete,
  onDateChange,
  onDateAdd,
  minDurationAmount,
  maxDurationAmount,
  data
}) => {
  const theme = useTheme()
  const [{ series, reduction, dimensionsTypesAreHomogenes, dates }, setState] = useState({
    series: [],
    reduction: [],
    dimensionsTypesAreHomogenes: true,
    dates: propDates
  });
  let { loading, error } = data
  const dateFormatter = dateFormatterGenerator(granularity)
  logger.log('GV:' + (loading ? 'loading' : 'computing'))
  
  
  const [ tooltipProps, onTooltipUpdate ] = useState({})
  
  useEffect(() => {
    if (loading) {
      setState({
        series: [], 
        reduction: [], 
        dimensionsTypesAreHomogenes: true,
        dates: propDates
      });
    } else {
      const computedKeys = keys.filter(key => dimensions[key].series !== undefined)
  
      // Format series and compute virtual dimentions in order to be injected in reCharts
      try {

        const _series = data.statistics.map(point => ({
          ...point,
          date: format(new Date(point.date), dateFormatter, { weekStartsOn: 1, locale: frLocale }),
          dimensions: point.dimensions.map(dimension => {
              const fullDimension = {
                ...deepmerge(dimension, computedKeys
                  .reduce((extraFields, computedKey) => 
                    deepmerge(extraFields,
                      computedKey
                        .split('.')
                        .reverse()
                        .reduce(
                          (o, k) => ({ [k]: o }),
                          dimensions[computedKey].f(dimension))
                      ),
                    {})),
                date: format(new Date(dimension.date), dateFormatter, { weekStartsOn: 1, locale: frLocale })
              }

              const handler = (o, key) => {
                const path = key.split('.')
                if (path.length === 0) {
                  return [ null, 0 ]
                } else if (path.length === 1) {
                  return [ o, path[0] ]
                } else {
                  return [ resolveObjectKeyChain(o, path.slice(0, -1)), path[path.length - 1] ]
                }

              }

              const handlers = keys.map(key => handler(fullDimension, key))
              const sum = handlers.reduce((sum, [handler, key]) => sum + handler[key], 0)
              for (const [handler, key] of handlers) {
                handler[key] = {
                  value: handler[key],
                  share: sum ? handler[key] / sum : null
                }
              }
              return fullDimension
            }
          )
        }))
        
        // compute reductions and variations between series
        const _reduction = _series[0].dimensions.map((dimension, i) => {
          const dimensionSerie = _series.map(point => point.dimensions[i])
          return keys.reduce((o, key) => {
            o[key] = dimensionSerie
              .map(entry => resolveObjectKeyChain(entry, key.split('.')).value)
              .reduce(dimensions[key].reducer, null)
            o[key] = o[key] !== null && typeof o[key] === 'object'
              ? o[key].value
              : o[key]
            return o
          }, {})
        }) 
        setState({
          series: _series,
          reduction: _reduction,
          dimensionsTypesAreHomogenes: Object.keys(_reduction[0]).reduce((type, key) =>
            type === dimensions[key].type
              ? type
              : null, dimensions[Object.keys(_reduction[0])[0]].type),
          dates: propDates
        })
        
      } catch (e) {
        logger.error('Unable to compute series from api : ' + e)
      }
    }
  }, [data, dates, keys, dateFormatterGenerator, granularity, dimensions])

  const InlineTooltip = useCallback(CustomTooltip(dimensions, graphStack), [dimensions, graphStack])
  
  logger.log('GV: rendering', reduction.length, dates.length)
  return <div className={classes.graph}>
    <div className={classes.paddedContent}>
      <SummaryTable
         reduction={reduction}
         dimensions={dimensions}
         onDateAdd={onDateAdd}
         onDateDelete={onDateDelete}
         onDateChange={onDateChange}
         granularity={granularity}
         timeAggregations={timeAggregations}
         durationAmount={durationAmount}
         durationUnit={durationUnit}
         dimensionsTypesAreHomogenes={dimensionsTypesAreHomogenes}
         graphStack={graphStack}
         dates={dates}
         dateFormatterGenerator={dateFormatterGenerator}
         colors={colors}
        />
    </div>

    <Toolbar variant="dense" className={classes.toolbar}>
      <IntegerWithSelectField
        integerValue={durationAmount}
        onIntegerValueChange={onDurationAmountChange}
        selectValue={durationUnit}
        onSelectValueChange={onDurationUnitChange}
        selectValues={Object.keys(timeAggregations).map(taKey => [taKey, timeAggregations[taKey].value])}
        minIntegerValue={minDurationAmount === undefined ? 1 : minDurationAmount} maxIntegerValue={maxDurationAmount}
        />
      <ToggleButtonGroup
        size="small" 
        value={granularity}
        exclusive
        onChange={(e, value) => value && typeof onGranularityChange === 'function' ? onGranularityChange(value) : null}
        aria-label="text alignment"
      >
        {Object.keys(timeAggregations).map(key => {
          const { value: label, icon: Icon } = timeAggregations[key]
          return <ToggleButton title={`Agréger par ${label.toLowerCase()}`} key={key} value={key} aria-label="value chart">
            <Icon />
          </ToggleButton>
        })}
      </ToggleButtonGroup>
      <ToggleButtonGroup
        size="small"
        value={representationMode}
        exclusive
        onChange={(e, value) => value && typeof setRepresentationMode === 'function' ? setRepresentationMode(value) : null}
        aria-label="text alignment"
      >
        <ToggleButton title="Valeurs" value="value" aria-label="value chart">
          <ValueChartIcon />
        </ToggleButton>
        <ToggleButton title="Proportions" value="share" aria-label="share chart">
          <ShareChartIcon />
        </ToggleButton>
      </ToggleButtonGroup>
      <ToggleButtonGroup
        size="small" 
        value={graphType}
        exclusive
        onChange={(e, value) => value && typeof onGraphTypeChange === 'function' ? onGraphTypeChange(value) : null}
        aria-label="text alignment"
      >
        <ToggleButton title="Graph en barres" value="bar" aria-label="Bar chart">
          <BarChartIcon />
        </ToggleButton>
        <ToggleButton title="Graph en lignes" value="line" aria-label="Line chart">
          <LineChartIcon />
        </ToggleButton>
      </ToggleButtonGroup>
      <ToggleButton
        value="check"
        size="small"
        selected={graphStack}
        title="Empiler"
        onChange={() => {
          if (typeof onGraphStackChange === 'function') {
            onGraphStackChange(!graphStack)
          }
        }}
      >
        <StackedLineChartIcon />
      </ToggleButton>
    </Toolbar>
    <Chart 
      classes={classes}
      dimensions={dimensions}
      dimensionsTypesAreHomogenes={dimensionsTypesAreHomogenes}
      series={series}
      keys={keys}
      onTooltipUpdate={onTooltipUpdate}
      smUpWidth={smUpWidth}
      granularity={granularity} representationMode={representationMode} graphStack={graphStack}
      graphType={graphType} serieType={graphOptions.serieType}
      colors={colors}
      TooltipContent={CustomTooltip}
      />
   
    {Object.keys(tooltipProps).length && !smUpWidth
        ?  <Box marginBottom={theme.spacing(2)}>
          <InlineTooltip {...tooltipProps}/>
        </Box>
        : null }
  </div>
}