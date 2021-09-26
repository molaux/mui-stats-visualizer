import React from 'react'
import {
  Box,
  TextField,
  Select,
  MenuItem,
  IconButton
} from '@mui/material'

import {
  KeyboardArrowDown as DownIcon,
  KeyboardArrowUp as UpIcon
} from '@mui/icons-material'

import { makeStyles } from '@mui/styles'
import { alpha } from '@mui/material/styles'

import plural from 'pluralize-fr'

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
  selectButton: {
    borderLeftWidth: 1,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderLeftStyle: 'solid',
    borderLeftColor: alpha(theme.palette.action.active, 0.12),
    backgroundColor: alpha(theme.palette.action.active, 0.06),
    color: theme.palette.action.active,
    borderRadius: `0 ${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0!important`,
    '&:hover, &:active': {
      backgroundColor: alpha(theme.palette.action.active, 0.12),
      color: theme.palette.action.active,
    },
    '& fieldset': {
      border: 0
    },
    '& .MuiSelect-select': {
      paddingTop: 7
    }
  },
}))

export const IntegerWithSelectField = ({onIntegerValueChange, integerValue, minIntegerValue, maxIntegerValue, onSelectValueChange, selectValue, selectValues}) => {
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
      />
      <IconButton
        size="small"
        onClick={() => (maxIntegerValue === undefined || integerValue < maxIntegerValue) &&  typeof onIntegerValueChange === 'function' 
          ? onIntegerValueChange(integerValue + 1)
          : null }
        >
        <UpIcon/>
      </IconButton>

      <Select
        value={selectValue}
        onChange={(e) => e.target.value && typeof onSelectValueChange === 'function' ? onSelectValueChange(e.target.value) : null}
        className={classes.selectButton}
        size="small"
      >
        {selectValues.map(([key, label]) => 
          <MenuItem key={key} value={key}>{integerValue > 1 ? plural(label) : label}</MenuItem>
        )}
      </Select>
  </Box>
}