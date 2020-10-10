import React, { Component, useState, useEffect, useRef } from 'react'
import { Route, withRouter } from 'react-router-dom'
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

import strtotime from 'locutus/php/datetime/strtotime'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'
import Radio from '@material-ui/core/Radio'
import Checkbox from '@material-ui/core/Checkbox'
import RadioGroup from '@material-ui/core/RadioGroup'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import FormControl from '@material-ui/core/FormControl'
import FormLabel from '@material-ui/core/FormLabel'
import Input from '@material-ui/core/Input'
import MenuItem from '@material-ui/core/MenuItem'
import Select from '@material-ui/core/Select'
import Chip from '@material-ui/core/Chip'
import Box from '@material-ui/core/Box'
import DateIcon from '@material-ui/icons/Timeline'
import DeleteIcon from '@material-ui/icons/Cancel'
import useMediaQuery from '@material-ui/core/useMediaQuery'
import TrendingDownIcon from '@material-ui/icons/TrendingDown'
import TrendingUpIcon from '@material-ui/icons/TrendingUp'
import TrendingFlatIcon from '@material-ui/icons/TrendingFlat'
import Color from 'color'

import {
  LocalizationProvider,
  DateTimePicker,
  DatePicker } from '@material-ui/pickers'
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft'
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight'
import AccessTime from '@material-ui/icons/AccessTime'
import DateRange from '@material-ui/icons/DateRange'
import AddIcon from '@material-ui/icons/Add'
import Divider from '@material-ui/core/Divider'

import Table from './TableResponsive'
import TableSelect from './TableSelect'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableRow from '@material-ui/core/TableRow'
import TableHead from '@material-ui/core/TableHead'

import PieIcon from './Pie'

import DateFnsUtils from '@date-io/date-fns'
import frLocale from "date-fns/locale/fr"

import gql from 'graphql-tag'
import { graphql } from '@apollo/react-hoc'

import { useTheme, withStyles, MuiThemeProvider } from '@material-ui/core/styles'
import { format } from 'date-fns'
import ggChartColors from './ChartColors'
import deepmerge from 'deepmerge'
import plural from 'pluralize-fr'

import loggerGenerator from './utils/logger'

const logger = loggerGenerator('error')

import { createMuiTheme } from '@material-ui/core'
const darkTheme = createMuiTheme({
  palette: {
    type: 'dark',
  },
  typography: {
    useNextVariants: true,
  }
})

const ITEM_HEIGHT = 48
const ITEM_PADDING_TOP = 8
const GRAPH_TINY_RATIO = 0.7
const GRAPH_WIDE_RATIO = 0.3

const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
}

function getStyles(key, keys, theme) {
  return {
    fontWeight:
      keys.indexOf(key) === -1
        ? theme.typography.fontWeightRegular
        : theme.typography.fontWeightMedium,
  }
}

const styles = theme => ({
  graph: {
    position: 'relative',
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(5),
    boxSizing: 'border-box',
  },
  pie: {
    fontSize: 10
  },
  tooltip: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(6px)',
    padding: theme.spacing(0, 0.5, 0.5, 0.5),
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[3],
    fontSize: '0.8em',
    '& td': {
      padding: theme.spacing(0.5, 1, 0.5, 1)
    },
    '& tr:last-child td': {
      borderBottom: 0
    }
  },
  formControl: {
    padding: theme.spacing(3),
    [theme.breakpoints.down('sm')]: {
      padding: 0,
      paddingTop: theme.spacing(1),
      paddingBottom: theme.spacing(1)
    },
    maxWidth: '100%',
    boxSizing: 'border-box',
  },
  radioGroup: {
    margin: theme.spacing(1, 0),
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
  },
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
  },
  table: {
    marginBottom: theme.spacing(4),
  },
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
})

const STATS_QUERY = gql`
  query Statistics($granularity: String!, $duration: String!, $series: [DimensionType!]) {
    statistics(granularity: $granularity, duration: $duration, series: $series)
  }
`

/**
 * Given an object and an array properties, resolves o[array[0]][array[1]][...]
 * array properties must be referenced as 'prop[i]' in keyChain
 * @param {object} o the object to dereference
 * @param {array} keyChain The properties chain
 * @return {object} The resolved object 
 */
const resolveObjectKeyChain = (o, keyChain) => keyChain
  .reduce((ro, property) => {
    if (property.slice(-1) === ']') {
      const openTokenIndex = property.indexOf('[')
      const arrayName = property.substring(0, openTokenIndex)
      const index =  property.substring(openTokenIndex + 1, property.length - 1)
      const value = ro[arrayName][index]
      return value === undefined ? 0 : value
    } else {
      const value = ro[property]
      return value === undefined ? 0 : value
    }
  }, o)

const DateTimeChip = withStyles(styles, { withTheme: true })(({ formatter, granularity, classes, onDelete, onChange, date, theme }) => <MuiThemeProvider theme={darkTheme}> 
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

const formatSerieValue = (dimension, value) => {
  if (value === null) {
    return ''
  }
  switch (dimension.type) {
    case 'currency':
      return value.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})
    case 'percent':
      return value.toLocaleString('fr-FR', {style: 'percent'})
    case 'integer':
      return Math.round(value)
    default:
      return value.toLocaleString('fr-FR', {style: 'decimal'})
  }
}

const ShareValue = ({value}) => isNaN(value) 
  ? null
  : <>
    <PieIcon angle={(value === 1 ? 0.999999 : value) * 2 * Math.PI} style={{width: '0.8em', height: '0.8em', margin: '0 0.2em -0.2em 0.2em'}} />
    {value.toLocaleString('fr-FR', {style: 'percent', minimumFractionDigits: 1})}
  </>

const Share = ({value}) => <Box component="span" style={{
    whiteSpace: 'nowrap'
  }}>
    <ShareValue value={value} />
  </Box>

const VariationValue = ({value}) => <>
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

const CustomTooltip = (dimensions, summize) => ({ active, payload, label, clasName, wrapperStyle, ...rest }) => {
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
    return <div className={clasName} style={wrapperStyle}>
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
                    ? formatSerieValue(dimensions[groupsByLabel[date].points[0].dataKey.split('.').slice(1).join('.')], groupsByLabel[date].total)
                    : null }</b>
                </TableCell>
                <TableCell>{groupsByLabel[date].points.reduce((hasShare, p) => hasShare && p.share !== null, true)
                  ? <Share value={1}/>
                  : null }</TableCell>
                <TableCell>
                  <b>{summize && groupsByLabel[date].variation !== null 
                    ? <Variation value={groupsByLabel[date].variation - 1} />
                    : null}</b>
                </TableCell>
              </TableRow>,
              ...groupsByLabel[date].points.map(point => {
                const serieKey = point.dataKey.split('.').slice(1).join('.')
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
                    {formatSerieValue(dimensions[serieKey], point.value)}
                  </TableCell>
                  <TableCell>
                    { point.share !== null ? 
                      <Share value={point.share} />
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

  return null
}

class Graph extends Component {
  constructor(props) {
    super(props);
    const { autoConfigs, defaultConfig, defaultGranularity, defaultDurationUnit, defaultDurationAmount, defaultKeys, defaultGraphType, defaultGraphStack } = this.props
    this.state = {
      granularity: defaultGranularity || (autoConfigs[defaultConfig].granularity ? autoConfigs[defaultConfig].granularity : 'day'),
      graphType: defaultGraphType || 'line',
      graphStack: defaultGraphStack !== undefined && defaultGraphStack !== null ? defaultGraphStack : false,
      keys: defaultKeys || [],
      dimensions: {},
      autoConfig: defaultConfig,
      durationUnit: defaultDurationUnit || autoConfigs[defaultConfig].durationUnit,
      durationAmount: defaultDurationAmount || autoConfigs[defaultConfig].durationAmount,
      dates: autoConfigs[defaultConfig].dates()
    }
    logger.log('V: init')

  }
  
  generateColors (keys) {
    let i = 0
    return keys.reduce((colors, key) => {
        colors[key] = ggChartColors[i++ % ggChartColors.length]
        return colors
      },
      {})
  }

  handleChangeKeys (event) {
    this.setState({ keys: Array.isArray(event) ? event : event.target.value })
    if (typeof this.props.onDimensionsSelectionChange === 'function') {
      this.props.onDimensionsSelectionChange(Array.isArray(event) ? event : event.target.value)
    }
  }

  dateFormatter(granularity) {
    switch (granularity) {
      case 'hour': return 'EEE dd/MM/yyyy, HH:mm'
      case 'day': return 'EEE dd/MM/yyyy'
      case 'week': return 'RRRR\', semaine \'II'
      case 'month': return 'MM/yyyy'
      case 'year': return 'yyyy'
      default: throw Error(`Granularity ${granularity} should be hour, day, week, month or year`)
    }
  }

  handleChangeGraphType(event) {
    this.setState({ graphType: event.target.value })
    if (typeof this.props.onGraphTypeChange === 'function') {
      this.props.onGraphTypeChange(event.target.value)
    }
  }

  handleChangeGraphStack(event) {
    this.setState({ graphStack: event.target.checked })
    if (typeof this.props.onGraphStackChange === 'function') {
      this.props.onGraphStackChange(event.target.checked)
    }
  }

  handleChangeGranularity(event) {
    this.setState({ granularity: event.target.value })
    if (typeof this.props.onGranularityChange === 'function') {
      this.props.onGranularityChange(event.target.value)
    }
  }

  handleChangeDurationAmount (event) {
    if (event.target.value !== '' && !isNaN(parseInt(event.target.value, 10))) {
      this.setState({
        autoConfig: null,
        durationAmount: event.target.value
      })
      if (typeof this.props.onDurationAmountChange === 'function') {
        this.props.onDurationAmountChange(parseInt(event.target.value, 10))
      }
    }
  }
  
  handleChangeDurationUnit (event) {
    this.setState({
      autoConfig: null,
      durationUnit: event.target.value
    })
    if (typeof this.props.onDurationUnitChange === 'function') {
      this.props.onDurationUnitChange(event.target.value)
    }
  }

  handleChangeAutoconfig (event) {
    const { autoConfigs } = this.props
    this.setState({
      granularity:  autoConfigs[event.target.value].granularity,
      durationUnit: autoConfigs[event.target.value].durationUnit,
      durationAmount: autoConfigs[event.target.value].durationAmount,
      dates: autoConfigs[event.target.value].dates(),
      autoConfig: event.target.value
    })
    if (typeof this.props.onAutoconfigChange === 'function') {
      this.props.onAutoconfigChange(event.target.value)
    }
  }

  handleChangeDate(j, date, ...rest) {
    this.setState(({dates}) => {
      let datesCopy = Array.from(dates)
      datesCopy[j] = date
      datesCopy = datesCopy.sort((a, b) => a.getTime() - b.getTime())
      return { 
        dates: datesCopy,
        autoConfig: null
      }
    })
  }

  handleAddDate() {
    this.setState(({dates, durationAmount, durationUnit}) => {
      let datesCopy = Array.from(dates)
      datesCopy.unshift(new Date(strtotime(`-${durationAmount} ${durationUnit}`, dates[0].getTime() / 1000) * 1000))
      return {
        autoConfig: null,
        dates: datesCopy
      }
    })
  }

  handleDeleteDate(j) {
    this.setState(state => state.dates.length > 1 
      ? {
        autoConfig: null,
        dates: state.dates.filter((_, i) => i !== j)
      }
      : {
        autoConfig: null,
        dates: [ new Date(strtotime(`-${state.durationAmount} ${state.durationUnit}`) * 1000) ]
      })
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    logger.log('V: did update')
    if (JSON.stringify(prevState) !== JSON.stringify(this.state)) {
      logger.log('V: pushing new url', `${this.props.prefixPath}/${encodeURIComponent(JSON.stringify(this.state))}`)
      this.props.history.push(`${this.props.prefixPath}/${encodeURIComponent(JSON.stringify(this.state))}`)
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    logger.log(
      'V: shouldUpdate?',
      JSON.stringify(nextState),
      JSON.stringify(this.state),
      JSON.stringify(nextState) !== JSON.stringify(this.state) || nextProps.dimensions !== this.props.dimensions)
    
    return JSON.stringify(nextState) !== JSON.stringify(this.state)
      || nextProps.dimensions !== this.props.dimensions
      || nextProps.smUpWidth !== this.props.smUpWidth;
  }

  static getDerivedStateFromProps(props, state) {
    logger.log('V: gdsfp - ', state.keys.length === 0)
    return {
        ...state,
        keys: state.keys.length === 0 ? Object.keys(props.dimensions).slice(0, 1) : state.keys,
      }
  }

  componentDidMount () {
    logger.log('V: did mount', this.props.match)
    let urlConfiguration = {}
    if (this.props.match && this.props.match.params.configuration) {
      logger.log('V: did mount with config')

      urlConfiguration = JSON.parse(decodeURIComponent(this.props.match.params.configuration))
      if (Array.isArray(urlConfiguration.dates)) {
        urlConfiguration.dates = urlConfiguration.dates.map(strDate => new Date(strDate))
      }
      this.setState(state => ({
        ...state,
        ...urlConfiguration
      }))
    } else {
      logger.log('V: pushing new url', `${this.props.prefixPath}/${encodeURIComponent(JSON.stringify(this.state))}`)
      this.props.history.push(`${this.props.prefixPath}/${encodeURIComponent(JSON.stringify(this.state))}`)
    }
  }

  /**
   * this.props.dimensions = {
   *   [category_dimension]: { // the dimension key
   *     group: { // defines the group to witch dimension belongs to
   *       depth, // sets the level of category
   *       label, // sets the label of the category
   *       dimension, // sets the label of the dimension
   *       key, // the group key
   *     },
   *     title, // the dimension detailed title as displayed (for legends and  tooltips)
   *     type, // a type of data (currency, ...)
   *     reducer, // a function to be applyed on whole serie and compute summary  (eg, avg or sum)
   * 
   *     // Optional virtual dimensions definition based on other dimensions
   *     series, // an array of dimension to be based on
   *     f: o => f(o), // a function to apply on dimensions and compute the  virtual dimension
   *   }
   * }
   */
  render() { 
    let { classes, graphOptions, theme, dimensionsSelector, autoConfigs, timeAggregations, smUpWidth } = this.props
    if ( !graphOptions ) {
      graphOptions = { serieType: 'linear' }
    }

    if ( !timeAggregations ) {
      timeAggregations = {
        hour: 'Heure',
        day: 'Jour',
        week: 'Semaine',
        month: 'Mois',
        year: 'An'
      }
    }
    
    if ( !graphOptions.serieType ) {
      graphOptions.serieType = 'linear'
    }
    
    if ( !graphOptions.formatters ) {
      graphOptions.formatters = {}
    }

    const { keys, dates } = this.state
    // Retrieve real dimensions involve, even in virtual dimensions
    const expandedKeys = [... new Set(keys.map(key => this.props.dimensions[key].series !== undefined 
      ? this.props.dimensions[key].series
      : key)
      .flat())]

    // Create series from start dates / dimensions
    const series = dates.map(date => ({
        from: date.toISOString(),
        dimensions: expandedKeys
      }))
    
    // Generate colors
    const mostRecentSerieIndex = series.length - 1
    const DesaturationIdealStep = 0.3
    const DesaturationMax = 1
    const desaturationAmount = DesaturationIdealStep * mostRecentSerieIndex > DesaturationMax ? DesaturationMax : DesaturationIdealStep * mostRecentSerieIndex
    const desaturationStep = series.length > 1 ? desaturationAmount / (series.length - 1) : 0
    const LuminosityIdealStep = 0.3
    const LuminosityMax = 0.6
    const luminosityAmount = LuminosityIdealStep * mostRecentSerieIndex > LuminosityMax ? LuminosityMax : LuminosityIdealStep * mostRecentSerieIndex
    const luminosityStep = series.length > 1 ? luminosityAmount / (series.length - 1) : 0
    const keysColors = this.generateColors(keys)
    const colors = {}
    for (let serieIndex = mostRecentSerieIndex; serieIndex >= 0; serieIndex--) {
      for (const key in keysColors) {
        const t = mostRecentSerieIndex - serieIndex
        colors[`${serieIndex}.${key}`] = Color(keysColors[key]).desaturate(t * desaturationStep).lighten(t * luminosityStep)
      }
    }

    // If not set, auto determine dimensions selector widget type
    if (!dimensionsSelector) {
      if (Object.keys(this.props.dimensions).length > 20) {
        dimensionsSelector = 'table'
      } else {
        dimensionsSelector = 'select'
      }
    }

    logger.log('V: render')
    
    // TODO: colors and stacks
    return <>
      <FormControl className={classes.formControl}>
        <FormLabel htmlFor="autoconfig">Pré-configuration</FormLabel>
        <Select
          value={this.state.autoConfig === null ? 'custom' : this.state.autoConfig}
          onChange={this.handleChangeAutoconfig.bind(this)}
          inputProps={{
            name: 'autoconfig',
            id: 'autoconfig',
          }}
        >
          <MenuItem disabled={true} value="custom">
            <em>Configuration personnalisée</em>
          </MenuItem>
          {Object.keys(autoConfigs).map(key => 
            <MenuItem key={key} value={key}>{autoConfigs[key].title}</MenuItem>
          )}
          
        </Select>
      </FormControl>
      
      <GraphQLDataViz 
        classes={classes}
        graphOptions={graphOptions}
        colors={colors}
        granularity={this.state.granularity}
        durationAmount={this.state.durationAmount}
        durationUnit={this.state.durationUnit}
        series={series}
        dimensions={this.props.dimensions}
        timeAggregations={timeAggregations}
        graphStack={this.state.graphStack}
        dates={dates}
        graphType={this.state.graphType}
        dateFormatterGenerator={this.dateFormatter}
        smUpWidth={smUpWidth}
        keys={keys}
        />
      <Divider variant="middle" />
      <FormControl className={classes.formControl} style={{minWidth: '100%'}}>
        <FormLabel>Dimensions</FormLabel>
        {dimensionsSelector === 'table'
          ? <TableSelect
              multiple
              value={keys.length === 0
                ? Object.keys(this.props.dimensions).slice(0, 1)
                : keys }
              onChange={this.handleChangeKeys.bind(this)}
              dimensionsGroupsComponent={this.props.dimensionsGroupsComponent || 'auto'}
              dimensions={this.props.dimensions}
            />
          : <Select
              multiple
              value={this.state.keys}
              onChange={this.handleChangeKeys.bind(this)}
              input={<Input id="select-multiple-chip" />}
              renderValue={selected => (
                <div className={classes.chips}>
                  {selected.map(value => (
                    <Chip key={value} label={this.props.dimensions[value].title} className={classes.chip} />
                  ))}
                </div>
              )}
              MenuProps={MenuProps}
            >
              {Object.keys(this.props.dimensions).map(key => (
                <MenuItem key={key} value={key} style={getStyles(key, this.state.keys, theme)}>
                  {this.props.dimensions[key].title}
                </MenuItem>
              ))}
            </Select>
        }
        
      </FormControl>

      <Divider variant="middle" />

      <div className={classes.formControl}>
      <LocalizationProvider dateAdapter={DateFnsUtils} locale={frLocale}>
          <FormLabel>Séries temporelles</FormLabel>
          <div className={classes.datesContainer}>
            <Chip
              label={<AddIcon />}
              onClick={this.handleAddDate.bind(this)}
              classes={{
                colorPrimary: classes.fatChip,
                clickableColorPrimary: classes.fatChip,
                deletableColorPrimary: classes.fatChip
              }}
              className={classes.chip}
              color="primary"
            />
            {!smUpWidth ? <br/> : null}
            {dates.map((date, i) => <DateTimeChip 
              key={i}
              date={date}
              granularity={this.state.granularity}
              formatter={this.dateFormatter(this.state.granularity === 'hour' ? 'hour' : 'day' )}
              classes={classes} 
              onChange={this.handleChangeDate.bind(this, i)} 
              onDelete={this.handleDeleteDate.bind(this, i)} />)}
           
          </div>
        </LocalizationProvider>
      </div>

      <Divider variant="middle" />

      <FormControl className={classes.formControl}>
        <FormLabel>Agrégation</FormLabel>
        <Select
          value={this.state.granularity}
          onChange={this.handleChangeGranularity.bind(this)}
        >
          {Object.keys(timeAggregations).map(taKey => 
            <MenuItem key={taKey} value={taKey}>Par {timeAggregations[taKey].toLowerCase()}</MenuItem>
          )}
        </Select>
      </FormControl>
      
      <FormControl className={classes.formControl} style={{marginLeft: theme.spacing(1)}}>
        <FormLabel>Durée</FormLabel>
        <TextField
          id="duration-amount"
          value={this.state.durationAmount}
          onChange={this.handleChangeDurationAmount.bind(this)}
          type="number"
          InputLabelProps={{
            shrink: true
          }}
          margin="normal"
        />
        <Select
          value={this.state.durationUnit}
          onChange={this.handleChangeDurationUnit.bind(this)}
        >
          {Object.keys(timeAggregations).map(taKey => 
            <MenuItem key={taKey} value={taKey}>{this.state.durationAmount > 1 ? plural(timeAggregations[taKey]) : timeAggregations[taKey]}</MenuItem>
          )}
        </Select>
      </FormControl>

      <Divider variant="middle" />

      <FormControl className={classes.formControl}>
        <FormLabel>Type de représentation</FormLabel>
        <RadioGroup
          aria-label="Type de graphe"
          className={classes.radioGroup}
          value={this.state.graphType}
          onChange={this.handleChangeGraphType.bind(this)}
        >
          <FormControlLabel value="line" control={<Radio />} label="Lignes" />
          <FormControlLabel value="bar" control={<Radio />} label="Colonnes" />
        </RadioGroup>
      </FormControl>

      <Divider variant="middle" />

      <FormControl className={classes.formControl}>
        <FormLabel>Empilement</FormLabel>
        <FormControlLabel  control={<Checkbox onChange={this.handleChangeGraphStack.bind(this)} checked={this.state.graphStack} />} label="Empiler" />
      </FormControl>
      
    </>
  }
}

const DataViz = ({
  dimensions,
  graphOptions,
  colors,
  timeAggregations,
  durationAmount,
  durationUnit,
  granularity,
  graphStack,
  classes,
  dateFormatterGenerator,
  graphType,
  smUpWidth,
  keys,
  dates: propDates,
  data
}) => {
  const [{ series, reduction, dimensionsTypesAreHomogenes, dates }, setState] = useState({
    series: [],
    reduction: [],
    dimensionsTypesAreHomogenes: true,
    dates: propDates
  });
  let { loading, error } = data
  const dateFormatter = dateFormatterGenerator(granularity)
  logger.log('GV:' + (loading ? 'loading' : 'computing'))
  // Select chart type
  let [ ChartComponent, SerieComponent ] = graphType === 'bar' 
    ? [ BarChart, Bar ]
    : !graphStack
      ? [ LineChart, Line ]
      : [ AreaChart, Area ]
  
  useEffect(() => {
    if (loading) {
      setState({
        series: [], 
        reduction: [], 
        dimensionsTypesAreHomogenes: true,
        dates: propDates
      });
    } else {
      const computedKeys = keys.filter(key => dimensions[key].series !== undefined)
  
      // Format series and compute virtual dimentions in order to be injected in reCharts
      try {
        const _series = data.statistics.map(point => ({
          ...point,
          date: format(new Date(point.date), dateFormatter, { weekStartsOn: 1, locale: frLocale }),
          dimensions: point.dimensions.map(dimension => ({
              ...deepmerge(dimension, computedKeys
                .reduce((extraFields, computedKey) => 
                  deepmerge(extraFields,
                    computedKey
                      .split('.')
                      .reverse()
                      .reduce(
                        (o, k) => ({ [k]: o }),
                        dimensions[computedKey].f(dimension))
                    ),
                  {})),
              date: format(new Date(dimension.date), dateFormatter, { weekStartsOn: 1, locale: frLocale })
            })
          )
        }))

        // compute reductions and variations between series
        const _reduction = _series[0].dimensions.map((dimension, i) => {
          const dimensionSerie = _series.map(point => point.dimensions[i])
          return keys.reduce((o, key) => {
            o[key] = dimensionSerie
              .map(entry => resolveObjectKeyChain(entry, key.split('.')))
              .reduce(dimensions[key].reducer, null)
            o[key] = o[key] !== null && typeof o[key] === 'object'
              ? o[key].value
              : o[key]
            return o
          }, {})
        }) 
        setState({
          series: _series,
          reduction: _reduction,
          dimensionsTypesAreHomogenes: Object.keys(_reduction[0]).reduce((type, key) =>
            type === dimensions[key].type
              ? type
              : null, dimensions[Object.keys(_reduction[0])[0]].type),
          dates: propDates
        })
        
      } catch (e) {
        logger.error('Unable to compute series from api : ' + e)
      }
    }
  }, [data, dates, keys, dateFormatterGenerator, granularity, dimensions])

  const graphContainerRef = useRef(null)
  
  logger.log('GV: rendering', reduction.length, dates.length)
  return <div className={classes.graph}>
    <div className={classes.paddedContent}>
      <Table className={classes.table}>
        <TableHead>
          <TableRow>
            <TableCell>
              Série
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
              <Typography variant={smUpWidth ? "h6" : "subtitle2"} gutterBottom={graphStack && dimensionsTypesAreHomogenes !== null}>
              {format(dates[i], dateFormatterGenerator(granularity === 'hour' ? 'hour' : 'day' ), { locale: frLocale })}, {durationAmount}&nbsp;{(durationAmount > 1 ? plural(timeAggregations[durationUnit]) : timeAggregations[durationUnit]).toLowerCase()}
              </Typography>
              {/* Check if graph is stacked and dimensions have same type */}
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
    </div>
    {smUpWidth ? 't' : 'f'}
    {typeof smUpWidth}

    <div className={classes.paddedContent} ref={graphContainerRef}>
      <div className={classes.ratioContainer} >
        <div className={classes.fullContainer}>
          <ResponsiveContainer id="987dazad__" >
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
              <YAxis />
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
                clasName={classes.tooltip}
                {...(!smUpWidth
                  ? {
                    position: {x:0, y: graphContainerRef.current?.offsetHeight ?? 150}
                  }
                  : null) }
                
                allowEscapeViewBox={{ x: false, y: true }}
                wrapperStyle={{ fontSize: 10, zIndex: 1200, ...(!smUpWidth ? { width: '100%' } : null) }}
                content={CustomTooltip(dimensions, graphStack)}
                />
              <CartesianGrid stroke="#f5f5f5" />

              {series.length 
                  ? series[0].dimensions.map((v, i) =>
                  keys.map(key =>
                    <SerieComponent
                      key={ `dimensions[${i}].` + key }
                      dataKey={ `dimensions[${i}].` + key }
                      stackId={ graphStack ? i : `dimensions[${i}].` + key }
                      // style={{ position: 'relative' }}
                      type={ graphOptions.serieType }
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
            </ChartComponent>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  </div>
}

const GraphQLDataViz = graphql(STATS_QUERY, {
    options: ({ granularity, durationAmount, durationUnit, series }) => ({
      variables: {
        granularity: granularity,
        duration: `${durationAmount} ${durationUnit}`,
        series: series
      }
    })
  })(DataViz)

const GraphWithStyle = withStyles(styles, { withTheme: true })(props => {
  const isWide = useMediaQuery(props.theme.breakpoints.up('sm'))
  return <Graph 
    smUpWidth={isWide} 
    {...props}
  />
})
 
const StyledGraphWithRoute = props => <Route 
    path={`${props.match.path}/:configuration?`}
    render={routeProps => <GraphWithStyle prefixPath={props.match.url} {...props} {...routeProps}/>}
  />
    
const StyledGraphWithRouteAndRouter = withRouter(StyledGraphWithRoute)

export default StyledGraphWithRouteAndRouter
