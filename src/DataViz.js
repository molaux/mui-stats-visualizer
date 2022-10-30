import React, { useState, useEffect, useCallback, forwardRef } from 'react'

import Toolbar from '@mui/material/Toolbar'
import {
  Box,
  ToggleButtonGroup,
  Typography,
  ToggleButton
} from '@mui/material'
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip'

import BarChartIcon from '@mui/icons-material/BarChart'
import LineChartIcon from '@mui/icons-material/ShowChart'
import ShareChartIcon from '@mui/icons-material/ViewWeek'
import ValueChartIcon from '@mui/icons-material/Equalizer'
import StackedLineChartIcon from '@mui/icons-material/StackedLineChart'

import { useTheme, styled } from '@mui/material/styles'

import { IntegerField } from '@molaux/mui-utils'

import { format } from 'date-fns'
import frLocale from "date-fns/locale/fr"

import { IntegerWithSelectField } from '@molaux/mui-utils'

import deepmerge from 'deepmerge'

import loggerGenerator from './utils/logger'
const logger = loggerGenerator('error')

import { resolveObjectKeyChain } from './utils/data'

import { SummaryTable } from './SummaryTable'

import { Tooltip as CustomTooltip } from './Tooltip'
import { Chart } from './Chart'

const HtmlTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: '#f5f5f9',
    color: 'rgba(0, 0, 0, 0.87)',
    maxWidth: 220,
    fontSize: theme.typography.pxToRem(12),
    border: '1px solid #dadde9',
  },
}))

export const DataViz = ({
  dimensions,
  graphOptions,
  colors,
  timeAggregations,
  durationAmount,
  onDurationAmountChange,
  movingWindowSize,
  onMovingWindowSizeChange,
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
  events,
  showEvents,
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
            let reduction = dimensionSerie
              .map(entry => resolveObjectKeyChain(entry, key.split('.')).value)
              .reduce(dimensions[key].reducer, null)
            
            reduction = reduction !== null && typeof reduction === 'object'
              ? reduction.value
              : reduction

            let altReduction = dimensions[key].altReducer
              ? dimensionSerie
                .map(entry => resolveObjectKeyChain(entry, key.split('.')).value)
                .reduce(dimensions[key].altReducer, null)
              : null
            
            altReduction = altReduction !== null && typeof altReduction === 'object'
              ? altReduction.value
              : altReduction

            o[key] = { main: reduction, alt: altReduction }
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
    return () => null
  }, [data, dates, keys, dateFormatterGenerator, granularity, dimensions])

  const InlineTooltip = useCallback(CustomTooltip(dimensions, graphStack), [dimensions, graphStack])

  const dayFormatter = dateFormatterGenerator('date')
  const configuredEvents = [...(events ?? []).map(
    (e) => {
      const key = format(new Date(e.startDate), dateFormatter, { weekStartsOn: 1, locale: frLocale })
      let graphKeys = []
      for (const serie of series) {
        for (const dimensionIndex in serie.dimensions) {
          const dimension = serie.dimensions[dimensionIndex]
          if (dimension.date === key) {
            graphKeys.push({
              k: serie.date,
              color: colors[`${dimensionIndex}.${keys?.[0]}`]
            })
            break
          }
        }
      }
      return graphKeys.map(({ k, color }, i) => ({
        ...e,
        id: `${e.id}-${i}`,
        startDate: k,
        realStartDate: format(new Date(e.startDate), dayFormatter, { weekStartsOn: 1, locale: frLocale }),
        originalStartDate: new Date(e.startDate),
        color
      }))
    }
  ).flat()
    .reduce((map, event) => {
      if (map.has(event.startDate)) {
        map.get(event.startDate).push(event)
      } else {
        map.set(event.startDate, [event])
      }
      return map
    }, new Map()).entries()]
    .map(([key, events]) => ({ key, events: events.sort((a, b) => b.originalStartDate.getTime() - a.originalStartDate.getTime()) }))

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
      <Tooltip
        title="Durée totale des séries"
      >
        <IntegerWithSelectField
          integerValue={durationAmount}
          onIntegerValueChange={onDurationAmountChange}
          selectValue={durationUnit}
          onSelectValueChange={onDurationUnitChange}
          selectValues={Object.keys(timeAggregations).map(taKey => [taKey, timeAggregations[taKey].value])}
          minIntegerValue={minDurationAmount === undefined ? 1 : minDurationAmount} maxIntegerValue={maxDurationAmount}
          />
      </Tooltip>
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
      
      <Tooltip
        title={`Étudier une fenêtre glissante de ${movingWindowSize} ${timeAggregations[granularity].value.toLowerCase()}${movingWindowSize > 1 && timeAggregations[granularity].value.toLowerCase().slice(-1) !== 's' ? 's' : ''}`}
      >
        <IntegerField
          integerValue={movingWindowSize}
          onIntegerValueChange={onMovingWindowSizeChange}
          minIntegerValue={1}
          maxIntegerValue={10000}
          />
      </Tooltip>

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
      events={configuredEvents}
      showEvents={showEvents}
      />
   
    {Object.keys(tooltipProps).length && !smUpWidth
        ?  <Box marginBottom={theme.spacing(2)}>
          <InlineTooltip {...tooltipProps}/>
        </Box>
        : null }
  </div>
}