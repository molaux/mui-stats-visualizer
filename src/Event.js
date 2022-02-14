import React from 'react'
import { ReferenceLine } from 'recharts'
import { Message } from '@mui/icons-material'
import { makeStyles } from '@mui/styles'

const useLabelStyle = makeStyles((theme) => ({
  event: ({ color }) => ({
    fill: color.toString(),
    color: color.toString(),
    '& > rect': {
      display: 'none',
    },
    '& > text': {
      stroke: 'white',
      strokeWidth: 2,
      strokeMiterlimit:4,
      strokeLinecap: 'butt',
      strokeLinejoin: 'miter',
      paintOrder: 'stroke fill'
    },
    '& > text ~ text': {
      display: 'none'
    },
    '&:hover': {
      fill: 'white',
      color: 'white',
      '& > text': {
        strokeWidth: 0
      },
      '& > text ~ text': {
        display: 'inherit'
      },
      '& > rect': {
        display: 'inherit',
        fill: color.toString()
      }
    }
  }),
  iconEvent: ({ color }) => ({
    fill: color.toString(),
    color: color.toString(),
    '& > text': {
      display: 'none',
      stroke: 'white',
      strokeWidth: 2,
      strokeMiterlimit:4,
      strokeLinecap: 'butt',
      strokeLinejoin: 'miter',
      paintOrder: 'stroke fill'
    },
    '&:hover': {
      '& > text': {
        display: 'inherit'
      }
    }
  })
}))

const LineRefLabel = ({ event, viewBox }) => {
  const classes = useLabelStyle({ color: event.events[0].color })
  return (

    <g
      className={classes.event}
    >
      <rect
        x={viewBox?.x - 15 - 13 * (event.events.length - 1)}
        y={viewBox?.y}
        height={viewBox.height}
        width={15 + 13 * (event.events.length - 1)}
      />
      {event.events.map(({ realStartDate, text }, i) => (
        <text
          key={`${text}-${i}`}
          x={viewBox?.x}
          y={viewBox?.y}
          dy={-3 - 13 * i}
          dx={-18}
          fontFamily="Roboto"
          fontSize="10px"
          textAnchor="end"
          transform={`rotate(-90 ${viewBox.x} 0)`}
        >
          {text} - {realStartDate}
        </text>
        )
      )}
      <g
        transform={`rotate(-90 ${viewBox.x} ${viewBox.y + 15})`}
      >
        <Message 
          x={viewBox.x}
          y={viewBox.y}
          height={15}
          width={15}
        />
      </g>
    </g>
  )
}

const IconRefLabel = ({ event, viewBox }) => {
  const classes = useLabelStyle({ color: event.events[0].color })
  return (

    <g
      className={classes.iconEvent}
    >
      <rect
        x={viewBox?.x}
        y={viewBox?.y}
        height={15}
        width={15}
        fill="transparent"
      />
      {event.events.map(({ realStartDate, text }, i) => (
        <text
          key={`${text}-${i}`}
          x={viewBox?.x}
          y={viewBox?.y}
          dy={23 + 13 * i}
          dx={0}
          fontFamily="Roboto"
          fontSize="10px"
          textAnchor="middle"
        >
          {realStartDate} - {text}
        </text>
        )
      )}
      
      <Message 
        x={viewBox.x}
        y={viewBox.y}
        height={15}
        width={15}
      />
    </g>
  )
}

// LineRefLabel.propTypes = {
//   color: PropTypes.string,
//   viewBox: PropTypes.shape({
//     x: PropTypes.number,
//     y: PropTypes.number
//   }),
//   label: PropTypes.string
// }

// LineRefLabel.defaultProps = {
//   color: 'red',
//   viewBox: null,
//   label: null
// }

export const buildEvent = ({ event, type }) => {
  if (event.events.length > 0) {
    return (
      <ReferenceLine
        key={event.key}
        x={event.key}
        stroke={event.events[0].color}
        strokeWidth={type === 'line' ? 1 : 0}
        label={type === 'line'
          ? <LineRefLabel
              event={event}
            />
          : <IconRefLabel
              event={event}
            />}
      />
    )
  }
  return null
}
