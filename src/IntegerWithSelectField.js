import React from 'react'
import Box from '@material-ui/core/Box'
import TextField from '@material-ui/core/TextField'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import { makeStyles, fade } from '@material-ui/core/styles'

import IconButton from '@material-ui/core/IconButton'
import DownIcon from '@material-ui/icons/KeyboardArrowDown'
import UpIcon from '@material-ui/icons/KeyboardArrowUp'

import plural from 'pluralize-fr'

const useStyles = makeStyles((theme) => ({
  numberFieldContainer: {
    borderRadius: theme.shape.borderRadius,
    border: '1px solid ' + fade(theme.palette.action.active, 0.12),
    '& .MuiInput-underline:before, & .MuiInput-underline:after, & .MuiInput-underline:hover:before, & .MuiInput-underline:hover:after': {
      borderBottom: 0
    },
    '& button': {
      borderRadius: 0,
      paddingTop: 7,
      paddingBottom: 7,
      color: fade(theme.palette.action.active, 0.38)
    }
  },
  numberField: {
    '& input[type=number]': {
      textAlign: 'right',
      paddingRight: theme.spacing(2),
      paddingBottom: 7,
      paddingTop: 8,
      borderBottom: 0,
      width: '3em',
      '-webkit-appearance': 'textfield',
      '-moz-appearance': 'textfield',
      'appearance': 'textfield',
      '&::-webkit-inner-spin-button,&::-webkit-outer-spin-button': { 
        '-webkit-appearance': 'none'
      }
    }
  },
  selectButton: {
    borderLeftWidth: '1px',
    borderLeftStyle: 'solid',
    borderLeftColor: fade(theme.palette.action.active, 0.12),
    backgroundColor: fade(theme.palette.action.active, 0.06),
    color: theme.palette.action.active,
    borderRadius: `0 ${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0!important`,
    '& .MuiSelect-root': {
      paddingTop: 8,
      paddingBottom: 7,
      paddingLeft: theme.spacing(2), 
    },
    '&:before': {
      borderBottom: 0
    },
    '&:after': {
      borderBottom: 0
    },
    '&:active': {
      borderBottom: 0
    },
    '&:hover:before': {
      borderBottom: '0!important'
    },
    '&:hover:after': {
      borderBottom: '0!important'
    },
    '&:active:before': {
      borderBottom: '0!important'
    },
    '&:active:after': {
      borderBottom: '0!important'
    },
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
      >
        {selectValues.map(([key, label]) => 
          <MenuItem key={key} value={key}>{integerValue > 1 ? plural(label) : label}</MenuItem>
        )}
      </Select>
  </Box>
}