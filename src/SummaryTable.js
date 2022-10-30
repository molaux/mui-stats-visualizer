import React, { useCallback, useState } from 'react'
import { makeStyles } from 'tss-react/mui'

import TextField from '@mui/material/TextField'
import AddIcon from '@mui/icons-material/Add'
import IconButton from '@mui/material/IconButton'
import DeleteIcon from '@mui/icons-material/Delete'
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import DateRangeIcon from '@mui/icons-material/DateRange'
import Box from '@mui/material/Box'

import Table from './TableResponsive'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import TableHead from '@mui/material/TableHead'
import { VariationValue, ShareValue, formatSerieValue } from './DataRepresentation'

import {
  DateTimePicker,
  DatePicker } from '@mui/x-date-pickers'

import plural from 'pluralize-fr'

const useStyles = makeStyles()(theme => ({
}))

export const SummaryTable = ({
    reduction,
    dimensions,
    onDateAdd,
    onDateDelete,
    onDateChange,
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
  const { classes } = useStyles()
  const [localDates, _setLocalDates] = useState(dates.map(date => new Date(date)))
  const setLocalDates = useCallback((i, date) => {
    _setLocalDates((dates) => {
      dates[i] = date
      return [...dates]
    })
  }, [_setLocalDates])
  const onDateAccepted = useCallback((i, date) => {
    setLocalDates(i, date)
    onDateChange(i, date)
  }, [setLocalDates, onDateChange])

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
        {graphStack && dimensionsTypesAreHomogenes
          ? <TableCell>
            Total sur la période
          </TableCell>
          : null}
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
        total: Object.keys(serie).reduce((total, key) => total + serie[key].main, 0),
        totalVariation: ! lastSeries.length 
          ? null
          : Object.keys(serie).reduce((total, key) => total + serie[key].main, 0) / lastSeries[lastSeries.length -1].total,
        variation: Object.keys(serie).reduce(
          (o, key) => {
            if (!lastSeries.length) {
              o[key] = null
            } else {
              o[key] = lastSeries[lastSeries.length -1].dimensions[key]
                ? serie[key].main / lastSeries[lastSeries.length -1].dimensions[key].main
                : null
            }
            return o
          },
          {}
        ) }
      ],
      []
    ).map(({dimensions: _dimensions, variation, total, length, totalVariation}, i) =>
      <TableRow key={i}>
        <TableCell>
          {typeof onDateDelete === 'function' 
            ? <IconButton size="small" onClick={() => onDateDelete(i)}><DeleteIcon/></IconButton>
            : null}
        </TableCell>
        <TableCell variant="head" component="th">
          {granularity === 'hour'
            ? <DateTimePicker
              renderInput={props => <TextField {...props} style={{width: '28ch'}} variant="standard" helperText={`${durationAmount} ${(durationAmount > 1 ? plural(timeAggregations[durationUnit].value) : timeAggregations[durationUnit].value).toLowerCase()}`} />}
              value={localDates[i]}
              disableFuture
              inputFormat={dateFormatterGenerator(granularity === 'hour' ? 'hour' : 'day' )}
              disableMaskedInput={true}
              ampm={false}
              onAccept={date => onDateAccepted(i, date)}
              onChange={(date) => setLocalDates(i, date)}
              leftArrowIcon={<KeyboardArrowLeftIcon/>}
              rightArrowIcon={<KeyboardArrowRightIcon/>}
              allowSameDateSelection={true}
              dateRangeIcon={<DateRangeIcon/>}
              timeIcon={<AccessTimeIcon/>}
              variant="standard"
            />
            : <DatePicker
              value={localDates[i]}
              disableFuture
              renderInput={props => <TextField {...props} style={{width: '23ch'}} variant="standard" helperText={`${durationAmount} ${(durationAmount > 1 ? plural(timeAggregations[durationUnit].value) : timeAggregations[durationUnit].value).toLowerCase()}`} />}
              inputFormat={dateFormatterGenerator(granularity === 'hour' ? 'hour' : 'day' )}
              disableMaskedInput={true}
              onAccept={date => onDateAccepted(i, date)}
              onChange={(date) => setLocalDates(i, date)}
              leftArrowIcon={<KeyboardArrowLeftIcon/>}
              rightArrowIcon={<KeyboardArrowRightIcon/>}
              allowSameDateSelection={true}
              
            />}
        </TableCell>
        {graphStack && dimensionsTypesAreHomogenes
          ? <TableCell>
              <Box style={{
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
            </TableCell>
          : null }
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
            {formatSerieValue(dimensions[key], _dimensions[key].main)}
            {variation[key] !== null || (graphStack && dimensionsTypesAreHomogenes)
              ? <Box component="span" style={{marginLeft:'1em'}}>
                ({graphStack && dimensionsTypesAreHomogenes
                  ? <ShareValue value={_dimensions[key] / total} />
                  : null}{variation[key] !== null
                  ? <VariationValue value={variation[key] - 1}/>
                  : null} )
              </Box>
              : null}
            <p style={{ whiteSpace: 'nowrap', fontSize: '0.8em' }}>
              ∑ = {formatSerieValue(dimensions[key], _dimensions[key].alt)}
            </p>
          </TableCell>
        )}
      </TableRow>
    )}
    </TableBody>
  </Table>
}