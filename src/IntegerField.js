import React, { forwardRef } from 'react'
import {
  Box,
  TextField,
  IconButton
} from '@mui/material'

import DownIcon from '@mui/icons-material/KeyboardArrowDown'
import UpIcon from '@mui/icons-material/KeyboardArrowUp'

import { makeStyles } from '@mui/styles'
import { alpha } from '@mui/material/styles'

const useStyles = makeStyles((theme) => ({
  numberFieldContainer: {
    display: 'inline-flex',
    alignItems: 'stretch',
    overflow: 'hidden',
    borderRadius: theme.shape.borderRadius,
    boxSizing: 'border-box',
    border: '1px solid ' + alpha(theme.palette.action.active, 0.12),
    '& .MuiInput-underline:before, & .MuiInput-underline:after, & .MuiInput-underline:hover:before, & .MuiInput-underline:hover:after': {
      borderBottom: 0
    },
    '& button': {
      borderRadius: 0,
      // paddingTop: 8,
      // paddingBottom: 7,
      color: alpha(theme.palette.action.active, 0.38),
      '&:active, &:hover': {
        backgroundColor: alpha(theme.palette.action.active, 0.12)
      }
    }
  },
  numberField: {
    '& input[type=number]': {
      textAlign: 'right',
      paddingRight: theme.spacing(2),
      // paddingBottom: 7,
      paddingTop: 7,
      borderBottom: 0,
      width: '3em',
      '-webkit-appearance': 'textfield',
      '-moz-appearance': 'textfield',
      'appearance': 'textfield',
      '&::-webkit-inner-spin-button,&::-webkit-outer-spin-button': { 
        '-webkit-appearance': 'none'
      }
    },
    '& fieldset': {
      border: 0
    }
  },
}))

export const IntegerField = forwardRef(({ onIntegerValueChange, integerValue, minIntegerValue, maxIntegerValue, ...props }, ref) => {
  const classes = useStyles()
  return <Box display="flex" alignItems="end" className={classes.numberFieldContainer}>
    <IconButton
      size="small"
      onClick={() => (minIntegerValue === undefined || integerValue > minIntegerValue) &&  typeof onIntegerValueChange === 'function' 
        ? onIntegerValueChange(integerValue - 1)
        : null }
      >
      <DownIcon/>
    </IconButton>
    <TextField
      ref={ref}
      id="duration-amount"
      value={integerValue}
      onChange={(e) => {
          const value = parseInt(e.target.value, 10)
          return value && typeof onIntegerValueChange === 'function'
            ? onIntegerValueChange((minIntegerValue === undefined || value >= minIntegerValue)
              ? (maxIntegerValue === undefined || value <= maxIntegerValue)
                ? value
                : maxIntegerValue
              : minIntegerValue)
            : null
        }}
      size="small"
      type="number"
      InputLabelProps={{
        shrink: true
      }}
      classes={{root: classes.numberField}}
      {...props}
    />
    <IconButton
      size="small"
      onClick={() => (maxIntegerValue === undefined || integerValue < maxIntegerValue) &&  typeof onIntegerValueChange === 'function' 
        ? onIntegerValueChange(integerValue + 1)
        : null }
      >
      <UpIcon/>
    </IconButton>
  </Box>
})