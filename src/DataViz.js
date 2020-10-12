import React, { useState, useEffect, useRef } from 'react'

import Typography from '@material-ui/core/Typography'
import Box from '@material-ui/core/Box'
import Table from './TableResponsive'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableRow from '@material-ui/core/TableRow'
import TableHead from '@material-ui/core/TableHead'

import ToggleButton from '@material-ui/lab/ToggleButton'
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup'
import Toolbar from '@material-ui/core/Toolbar'

import BarChartIcon from '@material-ui/icons/BarChart'
import LineChartIcon from '@material-ui/icons/ShowChart'
import ShareChartIcon from '@material-ui/icons/ViewWeek'
import ValueChartIcon from '@material-ui/icons/Equalizer'
import StackedLineChartIcon from '@material-ui/icons/StackedLineChart'
import MultilineChartIcon from '@material-ui/icons/MultilineChart'

import { format } from 'date-fns'
import frLocale from "date-fns/locale/fr"
import plural from 'pluralize-fr'

import deepmerge from 'deepmerge'

import loggerGenerator from './utils/logger'
const logger = loggerGenerator('error')
import { resolveObjectKeyChain } from './utils/data'
import { VariationValue, ShareValue, formatSerieValue } from './DataRepresentation'

import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts'

import { Tooltip as CustomTooltip } from './Tooltip'

export const DataViz = ({
  dimensions,
  graphOptions,
  colors,
  timeAggregations,
  durationAmount,
  durationUnit,
  granularity,
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
  data
}) => {
  const [{ series, reduction, dimensionsTypesAreHomogenes, dates }, setState] = useState({
    series: [],
    reduction: [],
    dimensionsTypesAreHomogenes: true,
    dates: propDates
  });
  let { loading, error } = data
  const dateFormatter = dateFormatterGenerator(granularity)
  logger.log('GV:' + (loading ? 'loading' : 'computing'))
  // Select chart type
  let [ ChartComponent, SerieComponent ] = graphType === 'bar' 
    ? [ BarChart, Bar ]
    : !graphStack
      ? [ LineChart, Line ]
      : [ AreaChart, Area ]
  
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

  const graphContainerRef = useRef(null)
  
  logger.log('GV: rendering', reduction.length, dates.length)
  return <div className={classes.graph}>
    <div className={classes.paddedContent}>
      <Table className={classes.table}>
        <TableHead>
          <TableRow>
            <TableCell>
              Série
            </TableCell>
            {reduction.length 
              ? Object.keys(reduction[0]).map((key, i) =>
                <TableCell key={key}>
                  {dimensions[key].title}
                </TableCell>)
              : null}
          </TableRow>
        </TableHead>
        <TableBody>
        {reduction.reduce(
          (lastSeries, serie) => [
            ...lastSeries, {
            dimensions: serie,
            total: Object.keys(serie).reduce((total, key) => total + serie[key], 0),
            totalVariation: ! lastSeries.length 
              ? null
              : Object.keys(serie).reduce((total, key) => total + serie[key], 0) / lastSeries[lastSeries.length -1].total,
            variation: Object.keys(serie).reduce(
              (o, key) => {
                if (! lastSeries.length) {
                  o[key] = null
                } else {
                  o[key] = lastSeries[lastSeries.length -1].dimensions[key] 
                    ? serie[key] / lastSeries[lastSeries.length -1].dimensions[key]
                    : null
                }
                return o
              },
              {}
            ) }
          ],
          []
        ).map(({dimensions: _dimensions, variation, total, totalVariation}, i) =>
          <TableRow key={i}>
            <TableCell>
              <Typography variant={smUpWidth ? "h6" : "subtitle2"} gutterBottom={graphStack && dimensionsTypesAreHomogenes !== null}>
              {format(dates[i], dateFormatterGenerator(granularity === 'hour' ? 'hour' : 'day' ), { locale: frLocale })}, {durationAmount}&nbsp;{(durationAmount > 1 ? plural(timeAggregations[durationUnit]) : timeAggregations[durationUnit]).toLowerCase()}
              </Typography>
              {/* Check if graph is stacked and dimensions have same type */}
              {graphStack && dimensionsTypesAreHomogenes
                      ? <Box style={{
                        whiteSpace: 'nowrap',
                        color: totalVariation !== null
                          ? totalVariation - 1 > 0
                            ? 'green'
                            : totalVariation - 1 < 0
                              ? 'red'
                              : 'inherit'
                          : 'inherit'
                        }}>
                        {formatSerieValue(dimensions[Object.keys(_dimensions)[0]], total)}
                        {totalVariation !== null 
                          ? <Box component="span" style={{marginLeft:'1em'}}>(<VariationValue value={totalVariation - 1}/> )</Box>
                          : null}
                      </Box>
                      : null }
            </TableCell>
            {Object.keys(_dimensions).map(key => 
              <TableCell 
                key={`${i}-${key}`} 
                style={{
                  whiteSpace: 'nowrap',
                  color: variation[key] !== null
                    ? variation[key] - 1 > 0
                      ? 'green'
                      : variation[key] - 1 < 0
                        ? 'red'
                        : 'inherit'
                    : 'inherit'
                  }}
                >
                <span style={{
                    display:'inline-block', 
                    width:'1em',
                    height: '1em',
                    marginRight: '0.3em',
                    marginBottom: '-0.15em',
                    backgroundColor: colors[`${i}.${key}`]
                  }}></span>
                {formatSerieValue(dimensions[key], _dimensions[key])}
                {variation[key] !== null || (graphStack && dimensionsTypesAreHomogenes)
                  ? <Box component="span" style={{marginLeft:'1em'}}>
                    ({graphStack && dimensionsTypesAreHomogenes
                      ? <ShareValue value={_dimensions[key] / total} />
                      : null}{variation[key] !== null
                      ? <VariationValue value={variation[key] - 1}/>
                      : null} )
                  </Box>
                  : null}
              </TableCell>
            )}
          </TableRow>
        )}
        </TableBody>
      </Table>
    </div>

    <Toolbar variant="dense" className={classes.toolbar}>
      <Box flexGrow={1}/>
      <ToggleButtonGroup
        size="small" 
        value={representationMode}
        exclusive
        onChange={(e, value) => value ? setRepresentationMode(value) : null}
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
        onChange={(e, value) => value ? onGraphTypeChange(value) : null}
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
          onGraphStackChange(!graphStack);
        }}
      >
        <StackedLineChartIcon />
      </ToggleButton>
    </Toolbar>

    <div className={classes.paddedContent} ref={graphContainerRef}>
      <div className={classes.ratioContainer} >
        <div className={classes.fullContainer}>
          <ResponsiveContainer id="987dazad__" >
            <ChartComponent
                data={series}
                margin={{
                  top: 0,
                  right: 0,
                  left: 20,
                  bottom: smUpWidth
                    ? ['hour', 'day', 'week'].includes(granularity)
                      ? 90
                      : 50
                    : ['hour', 'day', 'week'].includes(granularity)
                    ? 65
                    : 45 }}
              >
              <YAxis
                tickFormatter={
                  x => Object.keys(dimensions).length && (dimensionsTypesAreHomogenes || representationMode === 'share')
                    ? formatSerieValue(dimensions[Object.keys(dimensions)[0]], x, { type: representationMode === 'share' ? 'percent' : null })
                    : x
                 }
                domain={representationMode === 'share' ? [0,1] : null}
                />
              <XAxis
                dataKey={`date`}
                key={`date`}
                tick={({
                      x, y, stroke, payload,
                    }) => (
                      <g transform={`translate(${x},${y})`}>
                        <text x={0} y={0} dy={16} textAnchor="end" fill="#666" transform="rotate(-35)">{payload.value}</text>
                      </g>
                    )
                  }
                />
              <Tooltip
                clasName={classes.tooltip}
                {...(!smUpWidth
                  ? {
                    position: {x:0, y: graphContainerRef.current?.offsetHeight ?? 150}
                  }
                  : null) }
                
                allowEscapeViewBox={{ x: false, y: true }}
                wrapperStyle={{ fontSize: 10, zIndex: 1200, ...(!smUpWidth ? { width: '100%' } : null) }}
                content={CustomTooltip(dimensions, graphStack)}
                />
              <CartesianGrid stroke="#f5f5f5" />

              {series.length 
                  ? series[0].dimensions.map((v, i) =>
                  keys.map(key =>
                    <SerieComponent
                      key={ `dimensions[${i}].${key}` }
                      dataKey={ `dimensions[${i}].${key}.${representationMode}` }
                      stackId={ graphStack ? i : `dimensions[${i}].${key}` }
                      // style={{ position: 'relative' }}
                      type={ graphOptions.serieType }
                      dot={ false }
                      {...(SerieComponent===Line || SerieComponent===Area
                        ? { 
                          stroke: colors[`${i}.${key}`],
                          fill: colors[`${i}.${key}`],
                          strokeWidth: 3
                        }
                        : { 
                          fill: colors[`${i}.${key}`] 
                        })
                      }
                      >
                    </SerieComponent>
                  )
                )
              : null}
            </ChartComponent>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  </div>
}