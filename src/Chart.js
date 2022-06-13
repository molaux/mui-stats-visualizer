import React, { memo, useRef } from 'react'
import isEqual from "react-fast-compare"
import { makeStyles } from 'tss-react/mui'

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

import { formatSerieValue } from './DataRepresentation'

import { buildEvent } from './Event'

const GRAPH_TINY_RATIO = 0.7
const GRAPH_WIDE_RATIO = 0.3

const useSvgResponsiveContainersStyles = makeStyles()(theme => ({
  paddedContent: {
    position: 'relative',
    boxSizing: 'border-box',
    minWidth: '100%',
    marginTop: theme.spacing(1),
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
    [theme.breakpoints.down('sm')]: {
      paddingLeft: 0,
      paddingRight: 0
    },
  },
  ratioContainer: {
    paddingBottom: `${Math.round(GRAPH_WIDE_RATIO*100)}%`, /* width/height Ratio */
    position: 'relative',
    height: 0,
    [theme.breakpoints.down('md')]: {
      paddingBottom: `${Math.round(GRAPH_TINY_RATIO*100)}%`, /* width/height Ratio */
    },
  },
  fullContainer: {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
  }
}))

export const Chart = memo(({
  dimensions,
  dimensionsTypesAreHomogenes,
  series,
  keys,
  onTooltipUpdate,
  smUpWidth,
  granularity, representationMode, graphStack,
  graphType, serieType,
  colors,
  events,
  showEvents,
  TooltipContent
}) => {
  const graphContainerRef = useRef(null)
  const { classes } = useSvgResponsiveContainersStyles()
  // Select chart type
  const [ ChartComponent, SerieComponent ] = graphType === 'bar' 
    ? [ BarChart, Bar ]
    : !graphStack
      ? [ LineChart, Line ]
      : [ AreaChart, Area ]

  return <div className={classes.paddedContent} ref={graphContainerRef}>
    <div className={classes.ratioContainer} >
      <div className={classes.fullContainer}>
        <ResponsiveContainer id="987sdazad__">
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
                x => Object.keys(dimensions).length &&
                  (dimensionsTypesAreHomogenes || representationMode === 'share')
                    ? formatSerieValue(dimensions[Object.keys(dimensions)[0]], x, {
                      type: representationMode === 'share' ||
                        dimensionsTypesAreHomogenes === 'percent'
                          ? 'percent'
                          : null
                      })
                  : x.toLocaleString('fr-FR', {style: 'decimal', maximumFractionDigits: 1})
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
              // {...(!smUpWidth
              //   ? {
              //     position: {x:0, y: graphContainerRef.current?.offsetHeight ?? 150}
              //   }
              //   : null) }
              allowEscapeViewBox={{ x: false, y: true }}
              wrapperStyle={{ fontSize: 10, zIndex: 1200, ...(!smUpWidth ? { width: '100%' } : null) }}
              content={TooltipContent(dimensions, graphStack, onTooltipUpdate, !smUpWidth)}
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
                    type={ serieType }
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
            {showEvents
              ? events?.map((event) => buildEvent({
                  event: event,
                  type: graphType === 'bar' ? 'dot' : 'line'
                }))
              : null}
          </ChartComponent>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
}, isEqual)
