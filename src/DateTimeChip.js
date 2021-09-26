import React from 'react'

import DateIcon from '@mui/icons-material/Timeline'
import DeleteIcon from '@mui/icons-material/Cancel'
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft'
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight'
import AccessTime from '@mui/icons-material/AccessTime'
import DateRange from '@mui/icons-material/DateRange'
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'
import AddIcon from '@mui/icons-material/Add'

import {
  DateTimePicker,
  DatePicker
} from '@mui/lab'

import { withStyles, MuiThemeProvider } from '@mui/styles'
import { createMuiTheme } from '@mui/material'

const darkTheme = createMuiTheme({
  palette: {
    type: 'dark',
  },
  typography: {
    useNextVariants: true,
  }
})

const styles = theme => ({
  chip: {
    margin: 2,
  },
  fatChip: {
    height: '5em',
    padding: theme.spacing(1, 0),
    backgroundColor: theme.palette.primary.main,
    [theme.breakpoints.down('sm')]: {
      height: '4.5em'
    },
    '&:focus': {
      backgroundColor: theme.palette.primary.main
    }
  }
})

export const AddDateTimeChip = withStyles(styles)(({ onClick, classes  }) => <Chip
  label={<AddIcon />}
  onClick={onClick}
  classes={{
    colorPrimary: classes.fatChip,
    clickableColorPrimary: classes.fatChip,
    deletableColorPrimary: classes.fatChip
  }}
  className={classes.chip}
  color="primary"
/>)

export const DateTimeChip = withStyles(styles)(({ formatter, granularity, classes, onDelete, onChange, date }) => <MuiThemeProvider theme={darkTheme}> 
    <Chip
      icon={<DateIcon style={{color:'white'}} />}
      classes={{
        colorPrimary: classes.fatChip,
        clickableColorPrimary: classes.fatChip,
        deletableColorPrimary: classes.fatChip
      }}
      label={granularity === 'hour'
        ? <DateTimePicker
          label="Début de la série"
          renderInput={props => <TextField {...props} size="small" helperText={null} />}
          value={date}
          disableFuture
          labelFunc={value => value ? format(value, formatter, { locale: frLocale }) : ''}
          ampm={false}
          onAccept={onChange}
          onChange={() => null}
          leftArrowIcon={<KeyboardArrowLeft />}
          rightArrowIcon={<KeyboardArrowRight />}
          allowSameDateSelection={true}
          dateRangeIcon={<DateRange />}
          timeIcon={<AccessTime />}
          />
        : <DatePicker
          label="Début de la série"
          value={date}
          disableFuture
          renderInput={props => <TextField {...props} size="small" helperText={null} />}
          labelFunc={value => value ? format(value, formatter, { locale: frLocale }) : ''}
          onAccept={onChange}
          onChange={() => null}
          leftArrowIcon={<KeyboardArrowLeft />}
          rightArrowIcon={<KeyboardArrowRight />}
          allowSameDateSelection={true}
          />}
      onDelete={onDelete}
      deleteIcon={<DeleteIcon />}
      className={classes.chip}
      color="primary"
    />
  </MuiThemeProvider>)