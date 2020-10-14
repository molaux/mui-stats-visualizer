
import React from 'react'

import Table from './TableResponsive'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableRow from '@material-ui/core/TableRow'
import Typography from '@material-ui/core/Typography'

import { formatSerieValue, Share, Variation } from './DataRepresentation'
import { resolveObjectKeyChain } from './utils/data'
import { makeStyles } from '@material-ui/core/styles'
const useStyles = makeStyles((theme) => ({
  tooltip: ({isPopup}) =>  ({
    backgroundColor: isPopup ? 'rgba(255,255,255,0.95)' : 'transparent',
    backdropFilter: isPopup ? 'blur(6px)' : 'none',
    padding: theme.spacing(0, 0.5, 0.5, 0.5),
    borderRadius: theme.shape.borderRadius,
    boxShadow: isPopup ? theme.shadows[3] : 0,
    fontSize: '0.8em',
    '& td': {
      padding: theme.spacing(0.5, 1, 0.5, 1)
    },
    '& tr:last-child td': {
      borderBottom: 0
    }
  })
}))
export const Tooltip = (dimensions, summize, onUpdate, dontShow) => ({ active, payload, wrapperStyle }) => {
  const classes = useStyles({isPopup: dontShow === false})
  try {
    if (dontShow) {
      if (active && typeof onUpdate === 'function') {
        setTimeout(() => onUpdate({ active, payload, wrapperStyle }), 0)
      } 
      return null
    } else {
      const isShareRepresentation = payload.length && payload[0].dataKey.split('.').slice(-1)[0] === 'share'
      const groupsByLabel = (payload || []).reduce((groups, point) => {
        const dimensionKey = point.dataKey.split('.')[0]
        const date = resolveObjectKeyChain(point.payload, [ dimensionKey ]).date
        const groupsKeys = Object.keys(groups)
        const lastGroup = groupsKeys.length > 0 ? groups[groupsKeys[groupsKeys.length - 1]] : undefined
        const beforeLastGroup = groupsKeys.length > 1 ? groups[groupsKeys[groupsKeys.length - 2]] : undefined
        if (groups[date] === undefined) {
          groups[date] = {
            points: [ {
              ...point,
              variation: lastGroup !== undefined && lastGroup.points[0] !== undefined
                ? point.value / lastGroup.points[0].value
                : null,
              share: null
            } ],
            total: point.value,
            variation: lastGroup !== undefined
              ? point.value / lastGroup.total
              : null
          }
        } else {
          groups[date].points.push({
            ...point,
            variation: beforeLastGroup !== undefined && beforeLastGroup.points[groups[date].points.length] !== undefined
              ? point.value / beforeLastGroup.points[groups[date].points.length].value
              : null,
            share: null
          })
          groups[date].total += point.value
          groups[date].variation =  beforeLastGroup !== undefined
            ? groups[date].total / beforeLastGroup.total
            : null
          if (summize) {
            for (const point of groups[date].points) {
              point.share = point.value / groups[date].total
            }
          }
        }
        return groups
      }, {})

      if (active) {
        
          return <div className={classes.tooltip} style={wrapperStyle}>
            <Table size="small">
              <TableBody>
                {Object.keys(groupsByLabel).map((date, i) => 
                  [
                    <TableRow key={date} style={{backgroundColor: i%2 === 1 ? 'rgba(0, 0, 0, 0.05)' : 'transparent'}}>
                      <TableCell>
                        <Typography variant="subtitle2" component="p">
                          {date}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <b>{summize
                          ? formatSerieValue(dimensions[groupsByLabel[date].points[0].dataKey.split('.').slice(1, -1).join('.')], groupsByLabel[date].total, {type: isShareRepresentation ? 'percent' : null})
                          : null }</b>
                      </TableCell>
                      <TableCell>{groupsByLabel[date].points.reduce((hasShare, p) => hasShare && p.share !== null, true)
                        ? <Share value={1} iconOnly={isShareRepresentation}/>
                        : null }</TableCell>
                      <TableCell>
                        <b>{summize && groupsByLabel[date].variation !== null 
                          ? <Variation value={groupsByLabel[date].variation - 1} />
                          : null}</b>
                      </TableCell>
                    </TableRow>,
                    ...groupsByLabel[date].points.map(point => {
                      const serieKey = point.dataKey.split('.').slice(1, -1).join('.')
                      return <TableRow key={point.dataKey}  style={{backgroundColor: i%2 === 1 ? 'rgba(0, 0, 0, 0.05)' : 'transparent'}}>
                        <TableCell style={{color: point.stroke ? point.stroke : point.fill, whiteSpace: 'wrap', minWidth: '100', paddingLeft: '2em', textIndent: '-1.3em'}}>
                          <span style={{
                            display:'inline-block', 
                            width:'1em',
                            height: '1em',
                            marginRight: '0.3em',
                            marginBottom: '-0.15em',
                            backgroundColor: point.stroke ? point.stroke : point.fill
                          }}></span>
                          {dimensions[serieKey].title}
                        </TableCell>
                        <TableCell>
                          {formatSerieValue(dimensions[serieKey], point.value, {type: isShareRepresentation ? 'percent' : null})}
                        </TableCell>
                        <TableCell>
                          { point.share !== null ? 
                            <Share value={point.share} iconOnly={isShareRepresentation} />
                            : null }
                        </TableCell>
                        <TableCell>
                          { point.variation !== null
                            ? <Variation value={point.variation - 1} />
                            : null }
                        </TableCell>
                      </TableRow>
                    })
                  ]
                )}
              </TableBody>
            </Table>
          </div>
      }
    }
  } catch(e) { }
  
  return null
}