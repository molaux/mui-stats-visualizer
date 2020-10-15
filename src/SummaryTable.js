import React from 'react'
import { makeStyles } from '@material-ui/core/styles'

import TextField from '@material-ui/core/TextField'
import AddIcon from '@material-ui/icons/Add'
import IconButton from '@material-ui/core/IconButton'
import DeleteIcon from '@material-ui/icons/Delete'
import KeyboardArrowLeftIcon from '@material-ui/icons/KeyboardArrowLeft'
import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight'
import AccessTimeIcon from '@material-ui/icons/AccessTime'
import DateRangeIcon from '@material-ui/icons/DateRange'
import Box from '@material-ui/core/Box'

import Table from './TableResponsive'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableRow from '@material-ui/core/TableRow'
import TableHead from '@material-ui/core/TableHead'
import { VariationValue, ShareValue, formatSerieValue } from './DataRepresentation'

import {
  DateTimePicker,
  DatePicker } from '@material-ui/pickers'

import plural from 'pluralize-fr'

const useStyles = makeStyles(theme => ({

}))
export const SummaryTable = ({
    onDateAdd,
    reduction,
    dimensions,
    onDateDelete,
    granularity,
    timeAggregations,
    durationAmount,
    durationUnit,
    dimensionsTypesAreHomogenes,
    graphStack,
    dates,
    dateFormatterGenerator,
    colors
  }) => {
  const classes = useStyles()
  return <Table className={classes.table} size="small" >
    <TableHead>
      <TableRow>
        <TableCell>
          {typeof onDateAdd === 'function' 
            ? <IconButton size="small" onClick={onDateAdd}><AddIcon/></IconButton>
            : null
          }
        </TableCell>
        <TableCell>
          Série
        </TableCell>
        <TableCell>
          Total sur la période
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
          {typeof onDateDelete === 'function' 
            ? <IconButton size="small" onClick={() => onDateDelete(i)}><DeleteIcon/></IconButton>
            : null}
        </TableCell>
        <TableCell variant="head" component="th">
          {granularity === 'hour'
            ? <DateTimePicker
              renderInput={props => <TextField {...props} style={{width: '28ch'}} helperText={`${durationAmount} ${(durationAmount > 1 ? plural(timeAggregations[durationUnit].value) : timeAggregations[durationUnit].value).toLowerCase()}`} />}
              value={dates[i]}
              disableFuture
              inputFormat={dateFormatterGenerator(granularity === 'hour' ? 'hour' : 'day' )}
              disableMaskedInput={true}
              ampm={false}
              onAccept={date => onDateChange(date, i)}
              onChange={() => null}
              leftArrowIcon={<KeyboardArrowLeftIcon/>}
              rightArrowIcon={<KeyboardArrowRightIcon/>}
              allowSameDateSelection={true}
              dateRangeIcon={<DateRangeIcon/>}
              timeIcon={<AccessTimeIcon/>}
            />
            : <DatePicker
              value={dates[i]}
              disableFuture
              renderInput={props => <TextField {...props} style={{width: '23ch'}} helperText={`${durationAmount} ${(durationAmount > 1 ? plural(timeAggregations[durationUnit].value) : timeAggregations[durationUnit].value).toLowerCase()}`} />}
              inputFormat={dateFormatterGenerator(granularity === 'hour' ? 'hour' : 'day' )}
              disableMaskedInput={true}
              onAccept={date => onDateChange(date, i)}
              onChange={() => null}
              leftArrowIcon={<KeyboardArrowLeftIcon/>}
              rightArrowIcon={<KeyboardArrowRightIcon/>}
              allowSameDateSelection={true}
            />}
        </TableCell>
        <TableCell>
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
}