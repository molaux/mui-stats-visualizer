import React from 'react'

import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat'
import PieIcon from './Pie'
import Box from '@mui/material/Box'
import { useTheme } from '@mui/material/styles'

export const formatSerieValue = (dimension, value, options) => {
  if (value === null) {
    return ''
  }
  switch (options?.type || dimension.type) {
    case 'currency':
      return value.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})
    case 'percent':
      return value.toLocaleString('fr-FR', {style: 'percent', minimumFractionDigits: 1})
    case 'integer':
      return Math.round(value)
    default:
      return value.toLocaleString('fr-FR', {style: 'decimal', maximumFractionDigits: 1})
  }
}

export const ShareValue = ({value, iconOnly}) => isNaN(value) 
  ? null
  : <>
    <PieIcon angle={(value === 1 ? 0.999999 : value) * 2 * Math.PI} style={{width: '0.8em', height: '0.8em', margin: '0 0.2em -0.2em 0.2em'}} />
    {iconOnly ? null : value.toLocaleString('fr-FR', {style: 'percent', minimumFractionDigits: 1})}
  </>

export const Share = ({value, iconOnly}) => <Box component="span" style={{
    whiteSpace: 'nowrap'
  }}>
    <ShareValue value={value} iconOnly={iconOnly} />
  </Box>

export const VariationValue = ({value}) => <>
  {value > 0
    ? <TrendingUpIcon style={{margin: '0 0.2em -0.3em 0.2em'}} size="small"/>
    : value < 0
    ? <TrendingDownIcon style={{margin: '0 0.2em -0.3em 0.2em'}} size="small"/>
    : <TrendingFlatIcon style={{margin: '0 0.2em -0.3em 0.2em'}} size="small"/> }
  {Math.abs(value).toLocaleString('fr-FR', {style: 'percent', minimumFractionDigits: 1})}
</>
export const Variation = ({value}) => {
  const theme = useTheme()
  return <Box component="span" style={{
      whiteSpace: 'nowrap',
      color: value !== null
        ? value > 0
          ? theme.palette.success.main
          : value < 0
            ? theme.palette.error.main
            : 'inherit'
        : 'inherit'
    }}>
      <VariationValue value={value}/>
  </Box>
}